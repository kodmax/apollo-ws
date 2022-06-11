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
                this.vent.emit('sys-error', `Push data source <${this.definition.id}> update error: ${e}`, e)
            })
        }
    }

    public async getData(forceRefresh: boolean = false): Promise<T> {
        if (this.resolving) {
            return this.promise

        } else {
            const snapshotExpired = this.definition.expired(this.snapshot)
            const cacheIsEmpty = this.cache.isEmpty()

            if (!forceRefresh && !cacheIsEmpty && !snapshotExpired) {
                this.vent.emit('sys-log', `Serving [ Cached ] data source <${this.definition.id}> content.`)
                return this.snapshot.content()
    
            } else {
                const reason = forceRefresh ? 'Refresh Request' : cacheIsEmpty ? 'Cache Miss' : snapshotExpired ? 'Snapshot Expiration' : 'Not sure why'
                this.vent.emit('sys-log', `Refreshing data source <${this.definition.id}> content due to [ ${reason} ]`)

                return this.promise = new Promise(async (resolve, reject) => {
                    this.resolving = true
                    
                    try {
                        const aux = []
                        if (this.definition.dependencies) {
                            for (const id of this.definition.dependencies) {
                                if (id in this.sources) {
                                    aux.push(await this.sources [id].getData())
                
                                } else {
                                    reject(new Error('Data source dependency not registered: ' + id))
                                }
                            }    
                        }
            
                        const content = await this.definition.worker.apply(undefined, aux)
                        await this.cache.write(content)
    
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