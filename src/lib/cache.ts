import * as path from "path"
import * as fs from "fs"
import { Data } from "."

export type CacheData = {
    timestamp?: number
    exists: boolean
    content?: any
}

export class CacheEntry {
    private memcache?: CacheData

    public constructor(private path: string, private key?: string) {
        //
    }

    public async write(data: any) {
        this.memcache = {
            timestamp: new Date().getTime(),
            content: data,
            exists: true
        }
        
        if (this.key) {
            await fs.promises.writeFile(path.resolve(this.path, `${this.key}.json`), JSON.stringify(data, null, 4))
        }
    }

    public async read(): Promise<CacheData> {
        if (this.key) {
            try {
                const stat = await fs.promises.stat(path.resolve(this.path, `${this.key}.json`))
                return {
                    content: JSON.parse(await fs.promises.readFile(path.resolve(this.path, `${this.key}.json`), { encoding: 'utf-8' })),
                    timestamp: stat.mtime.getTime(),
                    exists: true
                }
        
            } catch(e) {
                return { exists: false }
            }
    
        } else {
            return this.memcache || { exists: false }
        }
    }

    public static age(entry: CacheData): number {
        return (new Date().getTime() - entry.timestamp) / 1000
    }
    
    public async refresh (isFresh: (entry: CacheData) => boolean, update: () => Promise<any>): Promise<Data> {
        const entry = this.memcache || await this.read()
    
        try {
            if (entry.exists && isFresh(entry)) {
                return {
                    content: entry.content,
                    fresh: true
                }
    
            } else {
                const content = await update()
                this.write(content)

                return { fresh: true, content }
            }
        
        } catch (e) {
            if (entry.exists) {
                return {
                    content: entry.content,
                    fresh: false
                }
    
            } else {
                throw e
            }
        }
    }
}

export class Cache {
    private readonly path: string
    
    public constructor(dir: string) {
        this.path = path.resolve(dir)

        fs.mkdirSync(this.path, { recursive: true })
    }

    public getEntry(key?: string): CacheEntry {
        return new CacheEntry(this.path, key)
    }
}