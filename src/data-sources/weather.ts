import { CacheEntry, Data, DataSource } from "../lib"
import { fetch } from "../fetch"
import * as apiKeys from "./.secrets/api-keys.json"

export const source: DataSource = {
    cron: "*/15 * * * *",

    worker: async (cache: CacheEntry): Promise<Data> => {
        return cache.refresh(entry => CacheEntry.age(entry) < 5, async () => {
            return await fetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/52.2282662%2C20.9737481?unitGroup=metric&key=${apiKeys["weather.visualcrossing.com"]}&contentType=json`).then(async resp => {
                return JSON.parse(resp.toString('utf-8'))
            })
        })
    }
}
