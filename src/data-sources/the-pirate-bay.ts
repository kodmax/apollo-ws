import { CacheEntry, Data, DataSource } from "../lib"
import { fetch } from "../fetch"

export const source: DataSource = {
    cron: "0 12 * * *",

    worker: async (cache: CacheEntry): Promise<Data> => {
        return cache.refresh(entry => CacheEntry.age(entry) < 60, async () => {
            return await fetch(`https://apibay.org/precompiled/data_top100_207.json`).then(async resp => JSON.parse(resp.toString('utf-8')))
        })
    }
}
