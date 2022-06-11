import { Cache, CacheEntry, CacheAgeUnit } from "./cache"
import { Chronos } from "./chronos"

import { WebSocket, WebSocketServer } from "ws"
import { EventEmitter } from "events"
import { DataSource, DataSourceDefinition } from "./data-source"
import { Socket } from "net"

export { Cache, CacheEntry, CacheAgeUnit }
export { DataSourceDefinition }

export type ApolloWebSocketOptions = {
    cache: Cache
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

    public constructor(private readonly options: ApolloWebSocketOptions, init: (instance: ApolloWebSocket) => Promise<void>) {        
        init(this).then(() => {
            const server = new WebSocketServer({ port: this.options.port || 3678 })
            const clients: Set<Client> = new Set<Client>()

            server.on("connection", (ws, req) => {
                const client: Client = {
                    subscriptions: new Set<string>(),
                    socket: req.socket,
                    ws
                }
                
                this.vent.emit('sys-log', `Client <${client.socket.remoteAddress}> connected.`)
    
                ws.on("message", data => {
                    const msg = data.toString("utf-8")
                    const i = msg.indexOf(' ')
    
                    if (msg.substring(0, i) === 'subscribe' && i > 0) {
                        const topics = new Set<string>(msg.substring(i + 1).split(' '))
                        topics.forEach(topic => client.subscriptions.add(topic))
                        
                        this.vent.emit('sys-log', `Client <${client.socket.remoteAddress}> requests subscription of [ ${[...topics.values()]} ].`)

                        for (const feedId of Object.keys(this.feeds).filter(id => topics.has('*') || topics.has(id))) {
                            this.vent.emit('sys-log', `Feed <${feedId}> update attempt due to client <${client.socket.remoteAddress}> subscription`)
                            this.feed(feedId)
                        }
                    }
                })
    
                clients.add(client)
                ws.on("error", e => {
                    this.vent.emit('sys-error', `Client <${client.socket.remoteAddress}> socket error: ` + e, e)
                })

                ws.on("close", () => {
                    this.vent.emit('sys-log', `Client <${client.socket.remoteAddress}> disconnected.`)
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

                    this.vent.emit('sys-log', `Feed <${id}> broadcast successful. [ ${clients.map(client => `<${client.socket.remoteAddress}>`)} ]`)

                } catch (e) {
                    this.vent.emit('sys-error', `Feed <${id}> broadcast error: ${e}`)
                }
            })
        })
    }

    public async addDataSource<T>(source: DataSourceDefinition<T>): Promise<void> {
        const cache = await this.options.cache.getEntry(source.volatile ? null : source.id)
        this.dataSources [source.id] = new DataSource(source, this.dataSources, cache, this.vent, (content: T) => {
            cache.write(content)

            this.vent.emit('sys-log', `Push data source <${source.id}> update successful`)
            this.vent.emit('data-update', source.id)
        })

        if (source.cron) {
            this.chronos.addJob(source.cron, async () => {
                try {
                    await this.dataSources [source.id].getData(true)
                    this.vent.emit('sys-log', `Crontab data source <${source.id}> update successful`)
                    this.vent.emit('data-update', source.id)
    
                } catch (e) {
                    this.vent.emit('sys-error', `Crontab data source <${source.id}> update error: ${e}`, e)
                }
            })    
        }
    }

    private async feed(feedId: string): Promise<any> {
        const feed = this.feeds [feedId]
        const data = await Promise.all(feed.sources.map(id => this.dataSources [id].getData()))
        try {
            const content = await feed.cb ? feed.cb.apply(undefined, data) : data [0]

            if (typeof content !== 'undefined') {
                this.vent.emit('sys-log', `Feed <${feedId}> update successful`)
                this.vent.emit('feed', feedId, content)
            }

        } catch (e) {
            this.vent.emit('sys-error', `Feed <${feedId}> update error: ${e}`, e)
        }
    }

    public addFeed(feedId: string, sources: string[], cb?: FeedCallback): void {
        this.feeds [feedId] = { sources, cb }

        this.vent.addListener('data-update', async sourceId => {
            if (sources.includes(sourceId)) {
                try {
                    this.vent.emit('sys-log', `Feed <${feedId}> update attempt due to data source <${sourceId}> update`)

                    const content = await this.feed(feedId)
                    if (typeof content !== 'undefined') {
                        this.vent.emit('feed', feedId, content)
                    }

                } catch (e) {
                    this.vent.emit('sys-error', `Feed <${feedId}> update error: ${e}`, e)
                }
            }
        })    
    }

    public async getData(id: string): Promise<any> {
        if (typeof this.dataSources [id] !== 'undefined') {
            return this.dataSources [id].getData()

        } else {
            throw new Error(`Data source <${id}> not registered.`)
        }
    }

    public addSysErrorListener<E extends Error>(cb: (msg: string, e: E) => void): void {
        this.vent.addListener('sys-error', async (msg: string, e: E) => {
            cb(msg, e)
        })
    }

    public addSysLogListener(cb: (msg: string) => void): void {
        this.vent.addListener('sys-log', async (msg: string) => {
            cb(msg)
        })
    }
}