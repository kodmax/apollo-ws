import { CacheEntry, Data, DataSource } from "../lib"
import { Fetch } from "./fetch"
import { URL } from "url"

export const source: DataSource = {
    cron: "0 */6 * * *",
    
    worker: async (cache: CacheEntry): Promise<Data> => {
        return cache.refresh(entry => CacheEntry.age(entry) < 60, async () => {
            return new Fetch(new URL("https://www.quandl.com")).fetch("/api/v3/datasets/OPEC/ORB?start_date=2022-01-01").then(response => JSON.parse(response.toString('utf-8')))
        })
    }
}
