import { CachedSnapshot, CacheEntry } from "./cache"

export type DataSourceDefinition<T> = {
    expired: (cache: CachedSnapshot<T>) => boolean
    worker: (...dependencies: any[]) => Promise<T>

    dependencies: string[]
    cron: string
    id: string
}

export class DataSource<T> {
    private snapshot: CachedSnapshot<T>
    private resolving: boolean = false
    private promise: Promise<T>

    public constructor(private readonly definition: DataSourceDefinition<T>, private readonly sources: Record<string, DataSource<any>>, private readonly cache: CacheEntry<T>) {
        this.snapshot = cache.getSnapshot()        
    }

    public async getData(forceRefresh: boolean = false): Promise<T> {
        if (this.resolving) {
            return this.promise

        } else if (!forceRefresh && !this.cache.isEmpty() && !this.definition.expired(this.snapshot)) {
            return this.snapshot.content()

        } else {
            return this.promise = new Promise(async (resolve, reject) => {
                this.resolving = true
                
                try {
                    const aux = []
                    for (const id of this.definition.dependencies) {
                        if (id in this.sources) {
                            aux.push(await this.sources [id].getData())
        
                        } else {
                            throw new Error('Data source dependency not registered: ' + id)
                        }
                    }
        
                    const content = await this.definition.worker.apply(undefined, aux)
                    await this.cache.write(content)

                    resolve(this.snapshot.content())
                    
                } catch (e) {
                    reject(e)
                }
        
                this.resolving = false
            })
        }
    }
}