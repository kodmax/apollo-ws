import * as path from "path"
import * as fs from "fs"

export enum CacheAgeUnit {
    SECONDS = 1,
    MINUTES = 60,
    HOURS = 3600,
    DAYS = 86400
}

type ContentSnapshot<T> = {
    timestamp?: number
    content?: T
}

export class CachedSnapshot<T> {
    public constructor(private readonly entry: ContentSnapshot<T>) {
        //
    }

    public age(unit: CacheAgeUnit): number {
        return (new Date().getTime() - this.entry.timestamp) / 1000 / unit
    }

    public content(): T {
        return this.entry.content
    }
}

export class CacheEntry<T> {
    private readonly content: CachedSnapshot<T>

    public constructor(private readonly path: string, private readonly snapshot: ContentSnapshot<T>, private key?: string) {
        this.content = new CachedSnapshot<T>(this.snapshot)
    }

    public async write(data: T) {
        this.snapshot.timestamp = new Date().getTime()
        this.snapshot.content = data
        
        if (this.key) {
            await fs.promises.writeFile(path.resolve(this.path, `${this.key}.json`), JSON.stringify(data, null, 4))
        }
    }

    public getSnapshot(): CachedSnapshot<T> {
        return this.content
    }

    public isEmpty(): boolean {
        return this.snapshot.content === undefined
    }
}

export class Cache {
    private readonly path: string
    
    public constructor(dir: string) {
        this.path = path.resolve(dir)

        fs.mkdirSync(this.path, { recursive: true })
    }

    public async getEntry<T>(key?: string): Promise<CacheEntry<T>> {
        const snapshot: ContentSnapshot<T> = {}
        if (key) {
            try {
                const stat = await fs.promises.stat(path.resolve(this.path, `${key}.json`))
                snapshot.content = JSON.parse(await fs.promises.readFile(path.resolve(this.path, `${key}.json`), { encoding: 'utf-8' }))
                snapshot.timestamp = stat.mtime.getTime()
        
            } catch (e) {
                if (e.code !== 'ENOENT') {
                    throw e
                }
            }
        }

        return new CacheEntry<T>(this.path, snapshot, key)
    }
}