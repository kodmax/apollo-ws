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

export class ApolloDaemon {
    private vent: EventEmitter = new EventEmitter()
    private chronos: Chronos = new Chronos()

    private data: Record<string, Data> = {}
    private feeds: Feed[] = []

    public constructor(private readonly options: ApolloDaemonOptions, init: (instance: ApolloDaemon) => void) {
        const server = new WebSocketServer({ port: this.options.port || 3678 })
        const clients: Set<WebSocket> = new Set<WebSocket>()
        init(this)

        server.on("connection", client => {
            clients.add(client)
            
            for (const feed of this.feeds) {
                feed.cb().then(value => {
                    if (typeof value !== 'undefined') {
                        client.send(`feed ${feed.id} ${JSON.stringify(value)}`, err => {
                            this.vent.emit('ws-error', err)
                        })    
                    }

                }).catch(e => {
                    this.vent.emit('feed-error', e)
                })
            }

            client.on("close", () => {
                clients.delete(client)
            })
        })

        this.vent.on('feed', (id, value) => {
            const content = JSON.stringify(value)

            for (const client of clients) {
                client.send(`feed ${id} ${content}`, err => {
                    this.vent.emit('ws-error', err)
                })
            }            
        })
    }

    public addDataSource(id: string, setup: DataSource) {
        this.chronos.addJob(setup.cron, async () => {
            try {
                this.update(id, await setup.worker(this.options.cache.getEntry(id)))

            } catch (e) {
                this.vent.emit('data-source-error', e)
            }
        })
    }

    private update(id: string, data: any) {
        this.data [id] = data

        this.vent.emit('data-update', id)
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
                if (sources.includes(id)) {
                    try {
                        feed.update(await feed.cb())
    
                    } catch (e) {
                        this.vent.emit('listener-error', e)
                    }
                }
            })    
        }

    }

    public getData(id: string): Data {
        return { ...this.data [id] }
    }
}