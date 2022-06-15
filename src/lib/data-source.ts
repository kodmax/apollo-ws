import EventEmitter from "events"
import { CachedSnapshot, CacheEntry } from "./cache"

export type DataSourceDefinition<T> = {
    expired: (cache: CachedSnapshot<T>) => boolean
    worker: (...dependencies: any[]) => Promise<T>
    id: string

    update?: (push: (content: T) => void, err: (e: Error) => void) => void
    dependencies?: string[]
    volatile?: boolean
    cron?: string
}

export class DataSource<T> {
    private snapshot: CachedSnapshot<T>
    private resolving: boolean = false
    private promise: Promise<T>

    public constructor(private readonly definition: DataSourceDefinition<T>, private readonly sources: Record<string, DataSource<any>>, private readonly cache: CacheEntry<T>, private readonly vent: EventEmitter, push: (content: T) => void) {
        this.snapshot = cache.getSnapshot()
        
        if (definition.update) {
            definition.update(push, e => {
                this.vent.emit('sys-log', 4, `Push data source <${this.definition.id}> update error: ${e}`, e)
            })
        }
    }

    public async getData(forceRefresh: boolean = false): Promise<T> {
        if (this.resolving) {
            return this.promise

        } else {
            const snapshotExpired = this.cache.isEmpty() || this.definition.expired(this.snapshot)

            if (!forceRefresh && !snapshotExpired) {
                this.vent.emit('sys-log', 7, `Serving [ Cached ] data source <${this.definition.id}> content.`)
                return this.snapshot.content()
    
            } else {
                const reason = forceRefresh ? 'Refresh Request' : 'Cache Miss'
                this.vent.emit('sys-log', 7, `Refreshing data source <${this.definition.id}> content due to [ ${reason} ]`)

                return this.promise = new Promise(async (resolve, reject) => {
                    this.resolving = true
                    
                    try {
                        const aux = []
                        if (this.definition.dependencies) {
                            for (const id of this.definition.dependencies) {
                                if (id in this.sources) {
                                    aux.push(await this.sources [id].getData(forceRefresh))
                
                                } else {
                                    reject(new Error('Data source dependency not registered: ' + id))
                                }
                            }    
                        }
            
                        const content = await this.definition.worker.apply(undefined, aux)
                        try {
                            await this.cache.write(content)

                        } catch (e) {
                            this.vent.emit('sys-log', 3, `Write Cache for errored: ${e}`, e)

                            throw e
                        }
    
                        resolve(this.snapshot.content())
                        this.resolving = false
                        
                    } catch (e) {
                        this.resolving = false
                        reject(e)
                    }
                })
            }    
        }
    }
}