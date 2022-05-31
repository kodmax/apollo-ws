import { CacheEntry, Data, DataSource } from "../lib"
import { JSDOM } from "jsdom"
import { fetch } from "../fetch"

const irPattern = /<tr>\s*<td><a href="wibor\?rateDate=&rateChartType=..">(WIBOR ..)[<>/a-z ]+\s*<\/td>\s*<td class="[a-zA-Z -]+">\s*(-?\d+,\d+)%\s*\((-?\d+,\d+)\)/g
const datePattern = /<td>Data<\/td>\s*<td class="textBold">(\d\d\d\d-\d\d-\d\d)<\/td>/

export const source: DataSource = {
    cron: "5 11,17 * * 1-5",

    worker: async (cache: CacheEntry): Promise<Data> => {
        return cache.refresh(entry => CacheEntry.age(entry) < 60, async () => {
            const wibor = await fetch(`https://www.bankier.pl/mieszkaniowe/stopy-procentowe/wibor`, { accept: 'text/html' }).then(resp => resp.toString('utf-8')).then(async html => {
                const rates = [...html.matchAll(irPattern)].map((match) => { return { period: match [1], interestRate: match [2].replace(',', '.'), delta: match [3].replace(',', '.') }})
                const date = datePattern.test(html) ? html.match(datePattern) [1] : ""
                return {
                    ...Object.fromEntries(rates.map(rate => { return [rate.period, { ir: rate.interestRate, delta: rate.delta, date }] })),
                }
            })

            const nbp = await fetch(`https://www.nbp.pl/home.aspx?f=/dzienne/stopy.htm`, { accept: 'text/html' }).then(resp => resp.toString('utf-8')).then(async html => {
                const document = new JSDOM(html).window.document
                return Object.fromEntries(Array.from(document.querySelectorAll('table.nbptable tr')).map(tr => Array.from(tr.children)).map(([name, value, date]) => { 
                    return [ name.textContent.trim(), { ir: value.textContent.trim().replace(',', '.'), date: date.textContent.trim() } ]
                }))
            })

            return { ...wibor, ...nbp }
        })
    }
}
