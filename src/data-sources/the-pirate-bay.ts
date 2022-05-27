import { URL } from "url"
import { CacheEntry, Data, DataSource } from "../lib"
import { Fetch } from "./fetch"

export const source: DataSource = {
    cron: "0 12 * * *",

    worker: async (cache: CacheEntry): Promise<Data> => {
        return cache.refresh(entry => CacheEntry.age(entry) < 60, async () => {
            return new Fetch(new URL("https://apibay.org")).fetch('/precompiled/data_top100_207.json').then(async resp => JSON.parse(resp.toString('utf-8')))
        })
    }
}
