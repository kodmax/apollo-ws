import { Cache, CacheEntry, CacheAgeUnit } from "./cache"
import { Chronos } from "./chronos"

import { WebSocket, WebSocketServer } from "ws"
import { EventEmitter } from "events"
import { DataSource, DataSourceDefinition } from "./data-source"

export { Cache, CacheEntry, CacheAgeUnit }
export { DataSourceDefinition }

export type ApolloWebSocketOptions = {
    cache: Cache
    port?: number
}

export type FeedCallback = (data: any[]) => any
export type Feed = {
    sources: string[],
    cb: FeedCallback,
}

type Client = {
    subscriptions: Set<string>,
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
                    ws, subscriptions: new Set<string>()
                }
                
                this.vent.emit('sys-log', `Client connected: ${req.socket.remoteAddress}`)
    
                ws.on("message", data => {
                    const msg = data.toString("utf-8")
                    const i = msg.indexOf(' ')
    
                    if (msg.substring(0, i) === 'subscribe' && i > 0) {
                        const topics = new Set<string>(msg.substring(i + 1).split(' '))
                        topics.forEach(topic => client.subscriptions.add(topic))
                        
                        for (const id of Object.keys(this.feeds).filter(id => topics.has('*') || topics.has(id))) {
                            this.feed(this.feeds [id]).then(value => {
                                if (typeof value !== 'undefined') {
                                    client.ws.send(`FEED ${id} ${JSON.stringify(value)}`, err => {
                                        if (err) {
                                            this.vent.emit('sys-log', `WebSocket send error: ${err}`)
                                        }
                                    })    
                                }
            
                            }).catch(e => {
                                this.vent.emit('sys-log', `Feed "${id}" refresh error: ${e}`)
                            })    
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
                            if (err) {
                                this.vent.emit('sys-log', `WebSocket send error: ${err}`)
                            }
                        })    
                    }
                }            
            })
        })
    }

    public async addDataSource<T>(source: DataSourceDefinition<T>): Promise<void> {
        this.dataSources [source.id] = new DataSource(source, this.dataSources, await this.options.cache.getEntry(source.id))

        this.chronos.addJob(source.cron, async () => {
            try {
                await this.dataSources [source.id].getData(true)
                this.vent.emit('data-update', source.id)

            } catch (e) {
                this.vent.emit('sys-log', `DataSource "${source.id}" refresh error: ${e}`)
                throw e
            }
        })
    }

    private async feed(feed: Feed): Promise<any> {
        const data = await Promise.all(feed.sources.map(id => this.dataSources [id].getData()))
        return await feed.cb(data)
    }

    public addFeed(id: string, sources: string[], cb: FeedCallback): void {
        this.feeds [id] = { sources, cb }

        this.vent.addListener('data-update', async id => {
            if (sources.includes(id)) {
                try {
                    const content = await this.feed(this.feeds [id])
                    if (typeof content !== 'undefined') {
                        this.vent.emit('feed', id, content)
                    }

                } catch (e) {
                    this.vent.emit('sys-log', `Feed "${id}" refresh error: ${e}`)
                }
            }
        })    
    }

    public async getData(id: string): Promise<any> {
        if (typeof this.dataSources [id] !== 'undefined') {
            return this.dataSources [id].getData()

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