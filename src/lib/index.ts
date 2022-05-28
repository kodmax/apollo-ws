import { Cache, CacheEntry } from "./cache"
import { Chronos } from "./chronos"

import { WebSocket, WebSocketServer } from "ws"
import { EventEmitter } from "events"

export { Cache, CacheEntry }

export type ApolloDaemonOptions = {
    cache: Cache

    port?: number
}

export type FeedInitCallback = (update: (content: any) => void, cache: CacheEntry) => () => Promise<any>
export type DataWorker = (cache: CacheEntry) => Promise<Data>

export type Feed = {
    cb: () => Promise<any>,
    id: string,
}

export type Data = {
    fresh: boolean
    content: any
}

export type DataSource = {
    worker: DataWorker
    cron: string
}

type Client = {
    subscriptions: Set<string>,
    ws: WebSocket,
}

export class ApolloWebSocket {
    private vent: EventEmitter = new EventEmitter()
    private chronos: Chronos = new Chronos()

    private data: Record<string, Data> = {}
    private feeds: Feed[] = []

    public constructor(private readonly options: ApolloDaemonOptions, init: (instance: ApolloWebSocket) => void) {
        const server = new WebSocketServer({ port: this.options.port || 3678 })
        const clients: Set<Client> = new Set<Client>()
        init(this)

        server.on("connection", (ws, req) => {
            const client: Client = {
                ws, subscriptions: new Set<string>()
            }
            
            this.vent.emit('sys-log', `Client connected: ${req.socket.remoteAddress}`)

            ws.on("message", data => {
                const msg = data.toString("utf-8")
                const i = msg.indexOf(' ')


                if (msg.substring(0, i) === 'subscribe' && i > 0) {
                    const requested = new Set<string>(msg.substring(i + 1).split(' '))

                    const topics = this.feeds.filter(feed => requested.has('*') || requested.has(feed.id)).map(feed => feed.id)
                    topics.forEach(topic => client.subscriptions.add(topic))
                    
                    for (const feed of this.feeds) {
                        if (topics.includes(feed.id)) {
                            feed.cb().then(value => {
                                if (typeof value !== 'undefined') {
                                    client.ws.send(`FEED ${feed.id} ${JSON.stringify(value)}`, err => {
                                        this.vent.emit('sys-log', `WebSocket send error: ${err}`)
                                    })    
                                }
            
                            }).catch(e => {
                                this.vent.emit('sys-log', `Feed "${feed.id}" refresh error: ${e}`)
                            })    
                        }
                    }
                }
            })

            clients.add(client)
            ws.on("close", () => {
                this.vent.emit('sys-log', `Client disconnected: ${req.socket.remoteAddress}`)
                clients.delete(client)
            })
        })

        this.vent.addListener('feed', async (id, value) => {
            const content = JSON.stringify(value)

            for (const client of clients) {
                if (client.subscriptions.has(id)) {
                    client.ws.send(`FEED ${id} ${content}`, err => {
                        this.vent.emit('sys-log', `WebSocket send error: ${err}`)
                    })    
                }
            }            
        })
    }

    public addDataSource(id: string, setup: DataSource) {
        this.chronos.addJob(setup.cron, async () => {
            try {
                this.data [id] = await setup.worker(this.options.cache.getEntry(id))
                this.vent.emit('data-update', id)

            } catch (e) {
                this.vent.emit('sys-log', `DataSource "${id}" refresh error: ${e}`)
            }
        })
    }

    public addFeed(id: string, sources: string[], init: FeedInitCallback): void {
        const update = (content: any) => {
            if (typeof content !== 'undefined') {
                this.vent.emit('feed', id, content)
            }
        }

        const feed = { id, cb: init(update, this.options.cache.getEntry()), update }
        this.feeds.push(feed)

        if (sources.length > 0) {
            this.vent.addListener('data-update', async id => {
                if (sources.includes(id) && sources.every(id => typeof this.data [id] !== 'undefined')) {
                    try {
                        feed.update(await feed.cb())
    
                    } catch (e) {
                        this.vent.emit('sys-log', `Feed "${feed.id}" refresh error: ${e}`)
                    }
                }
            })    
        }

    }

    public getData(id: string): Data {
        if (typeof this.data [id] !== 'undefined') {
            return { ...this.data [id] }

        } else {
            throw new Error(`Data source "${id}" not available.`)
        }
    }

    public addSysLogListener(cb: (msg: string) => void): void {
        this.vent.addListener('sys-log', async (msg: string) => {
            cb(msg)
        })
    }
}