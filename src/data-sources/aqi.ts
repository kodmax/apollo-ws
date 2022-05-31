import { CacheEntry, Data, DataSource } from "../lib"
import * as apiKeys from "./.secrets/api-keys.json"
import { fetch } from "../fetch"

export const source: DataSource = {
    cron: "15 * * * *",

    worker: async (cache: CacheEntry): Promise<Data> => {
        return cache.refresh(entry => CacheEntry.age(entry) < 5, async () => {
            return await fetch(`https://api.waqi.info/feed/geo:52.2282662;20.9737481/?token=${apiKeys ["aqicn.org"]}`).then(async resp => {
                const payload = JSON.parse(resp.toString('utf-8'))
                if (payload.status !== 'ok') {
                    throw new Error('AQI data fetch error')
                } else {
                    return payload.data
                }
            })
        })
    }
}
