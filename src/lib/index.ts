import { Cache, CacheEntry, CacheAgeUnit } from "./cache"
import { Chronos } from "./chronos"

import { WebSocket, WebSocketServer, AddressInfo } from "ws"
import { EventEmitter } from "events"
import { DataSource, DataSourceDefinition } from "./data-source"
import { Socket } from "net"

export { Cache, CacheEntry, CacheAgeUnit }
export { DataSourceDefinition }

export type ApolloWebSocketOptions = {
    /**
     * Syslog Facility. Specify to get PRI tags for events messages.
     */
    facility?: number

    /**
     * Provide a Cache instance. The cache provider is available in apollo-ws package
     */
    cache: Cache

    /**
     * Defaults to 3678
     */
    port?: number
}

export type FeedCallback = (...data: any[]) => any
export type Feed = {
    sources: string[],
    cb?: FeedCallback,
}

type Client = {
    subscriptions: Set<string>,
    socket: Socket,
    ws: WebSocket,
}

export class ApolloWebSocket {
    private vent: EventEmitter = new EventEmitter()
    private chronos: Chronos = new Chronos()
    private dataSources: Record<string, DataSource<any>> = {}
    private feeds: Record<string, Feed> = {}

    public static async listen<T>({ cache, port = 3678, facility = -1 }: ApolloWebSocketOptions, init: (instance: ApolloWebSocket) => Promise<T>): Promise<T> {
        const serv = new ApolloWebSocket({ cache, port, facility })
        const ret = await init(serv)
        await serv.connect()

        return ret
    }

    private constructor(private readonly options: Required<ApolloWebSocketOptions>) {}
    private connect(): Promise<void> {
        const server = new WebSocketServer({ port: this.options.port })
        const clients: Set<Client> = new Set<Client>()

        server.on("connection", (ws, req) => {
            const client: Client = {
                subscriptions: new Set<string>(),
                socket: req.socket,
                ws
            }
            
            this.vent.emit('sys-log', 6, `Client <${client.socket.remoteAddress}> connected.`)

            ws.on("message", data => {
                const msg = data.toString("utf-8")
                const i = msg.indexOf(' ')

                if (msg.substring(0, i) === 'subscribe' && i > 0) {
                    const topics = new Set<string>(msg.substring(i + 1).split(' '))
                    topics.forEach(topic => client.subscriptions.add(topic))
                    
                    this.vent.emit('sys-log', 6, `Client <${client.socket.remoteAddress}> requests subscription of [ ${[...topics.values()]} ].`)

                    const updates: Promise<void>[] = []
                    for (const feedId of Object.keys(this.feeds).filter(id => topics.has('*') || topics.has(id))) {
                        this.vent.emit('sys-log', 7, `Feed <${feedId}> request from client <${client.socket.remoteAddress}>`)
                        updates.push(this.feed(feedId).catch(e => {
                            this.vent.emit('sys-log', 4, `Feed <${feedId}> request failed: ${e}`, e)
                            return e
                        }))
                    }
                }
            })

            clients.add(client)
            ws.on("error", e => {
                this.vent.emit('sys-log', 5, `Client <${client.socket.remoteAddress}> socket error: ` + e, e)
            })

            ws.on("close", () => {
                this.vent.emit('sys-log', 6, `Client <${client.socket.remoteAddress}> disconnected.`)
                clients.delete(client)
            })
        })

        this.vent.addListener('feed', async (id, value) => {
            const content = JSON.stringify(value)

            const outbox: Promise<Client>[] = []
            for (const client of clients) {
                if (client.subscriptions.has('*') || client.subscriptions.has(id)) {
                    outbox.push(new Promise((resolve, reject) => {
                        client.ws.send(`FEED ${id} ${content}`, e => e ? reject(e) : resolve(client))
                    }))
                }
            }

            try {
                const clients: Client[] = await Promise.all(outbox)

                this.vent.emit('sys-log', 6, `Feed <${id}> broadcast successful. [ ${clients.map(client => `<${client.socket.remoteAddress}>`)} ]`)

            } catch (e) {
                this.vent.emit('sys-log', 4, `Feed <${id}> broadcast error: ${e}`)
            }
        })

        return new Promise((resolve, reject) => {
            server.on("listening", () => {
                const addr = server.address() as AddressInfo
                const port = typeof server.address() === 'string' ? server.address() : `${addr.family} ${addr.address}:${addr.port}`
                this.vent.emit('sys-log', 5, `Apollo WebSocket Server listening for connections at <${port}>`)

                resolve()
            })
            
            server.on("error", e => {
                this.vent.emit('sys-log', 2, `Apollo WebSocket Server network port bind error: ${e}`, e)
                reject(e)
            })
        })
    }

    public async addDataSource<T>(source: DataSourceDefinition<T>): Promise<void> {
        const cache = await this.options.cache.getEntry(source.volatile ? null : source.id)
        this.dataSources [source.id] = new DataSource(source, this.dataSources, cache, this.vent, (content: T) => {
            try {
                cache.write(content)

            } catch (e) {
                this.vent.emit('sys-log', 3, `Write Cache for errored: ${e}`, e)

                throw e
            }

            this.vent.emit('sys-log', 7, `Push data source <${source.id}> update successful`)
            this.vent.emit('data-update', source.id)
        })

        if (source.cron) {
            this.chronos.addJob(source.cron, async () => {
                try {
                    await this.dataSources [source.id].getData(true)
                    this.vent.emit('sys-log', 5, `Crontab data source <${source.id}> update successful`)
                    this.vent.emit('data-update', source.id)
    
                } catch (e) {
                    this.vent.emit('sys-log', 4, `Crontab data source <${source.id}> update error: ${e}`, e)
                }
            })    
        }
    }

    private async feed(feedId: string): Promise<any> {
        const feed = this.feeds [feedId]
        const data = await Promise.all(feed.sources.map(id => this.dataSources [id].getData()))
        const content = await feed.cb ? feed.cb.apply(undefined, data) : data [0]

        if (typeof content !== 'undefined') {
            this.vent.emit('sys-log', 7, `Feed <${feedId}> update successful`)
            this.vent.emit('feed', feedId, content)
        }
    }

    public addFeed(feedId: string, sources: string[], cb?: FeedCallback): void {
        this.feeds [feedId] = { sources, cb }

        this.vent.addListener('data-update', async (sourceId: string) => {
            if (sources.includes(sourceId)) {
                try {
                    this.vent.emit('sys-log', 7, `Feed <${feedId}> update attempt due to data source <${sourceId}> update`)

                    const content: any = await this.feed(feedId)
                    if (typeof content !== 'undefined') {
                        this.vent.emit('feed', feedId, content)
                    }

                } catch (e) {
                    this.vent.emit('sys-log', 4, `Feed <${feedId}> update error: ${e}`, e)
                }
            }
        })    
    }

    public addSysLogListener(cb: (msg: string, e?: Error) => void): void {
        this.vent.addListener('sys-log', (pri: number, msg: string, e?: Error) => {
            if (this.options.facility > 0) {
                cb(`<${(this.options.facility << 3) + pri}> ${msg}`, e)

            } else {
                cb(msg, e)
            }
        })
    }
}