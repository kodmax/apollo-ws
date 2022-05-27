import { URL } from "url"
import { CacheEntry, Data, DataSource } from "../lib"
import { Fetch } from "./fetch"
import * as apiKeys from "./.secrets/api-keys.json"

export const source: DataSource = {
    cron: "0 */6 * * *",

    worker: async (cache: CacheEntry): Promise<Data> => {
        return cache.refresh(entry => CacheEntry.age(entry) < 60, async () => {
            return new Fetch(new URL("https://weather.visualcrossing.com")).fetch(`/VisualCrossingWebServices/rest/services/timeline/52.2282662%2C20.9737481?unitGroup=metric&key=${apiKeys.visualcrossing}&contentType=json`).then(async resp => {
                return JSON.parse(resp.toString('utf-8'))
            })
        })
    }
}
