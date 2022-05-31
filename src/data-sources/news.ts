import { CacheEntry, Data, DataSource } from "../lib"
import { fetch } from "../fetch"
import { JSDOM } from "jsdom"

export const source: DataSource = {
    cron: "0 * * * *",
    
    worker: async (cache: CacheEntry): Promise<Data> => {
        return cache.refresh(entry => CacheEntry.age(entry) < 15, async () => {
            return await fetch(`https://news.google.com/topstories?hl=pl&gl=PL&ceid=PL%3Apl`, { accept: 'text/html' }).then(resp => resp.toString('utf-8')).then(async html => {
                const document = new JSDOM(html).window.document
                return Array.from(document.querySelectorAll('h3 > a')).map(header => {
                    return { title: header.innerHTML, href: header.getAttribute("href") }
                })
            })
        })
    }
}
