import { CacheEntry, Data, DataSource } from "../lib"
import { fetch } from "../fetch"

export const source: DataSource = {
    cron: "0 */6 * * *",
    
    worker: async (cache: CacheEntry): Promise<Data> => {
        return cache.refresh(entry => CacheEntry.age(entry) < 60, async () => {
            return await fetch(`https://www.quandl.com/api/v3/datasets/OPEC/ORB?start_date=2022-01-01`, { accept: 'application/json' }).then(response => {
                console.log(response.toString('utf-8'))
                return JSON.parse(response.toString('utf-8'))
            })
        })
    }
}
