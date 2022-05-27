import { CacheEntry, Data, DataSource } from "../lib"
import { Fetch } from "./fetch"

const irPattern = /<tr>\s*<td><a href="wibor\?rateDate=&rateChartType=..">(WIBOR ..)[<>/a-z ]+\s*<\/td>\s*<td class="[a-zA-Z -]+">\s*(-?\d+,\d+)%\s*\((-?\d+,\d+)\)/g
const datePattern = /<td>Data<\/td>\s*<td class="textBold">(\d\d\d\d-\d\d-\d\d)<\/td>/

export const source: DataSource = {
    cron: "5 11,17 * * 1-5",

    worker: async (cache: CacheEntry): Promise<Data> => {
        return cache.refresh(entry => CacheEntry.age(entry) < 60, async () => {
            return new Fetch(new URL("https://www.bankier.pl")).fetch("/mieszkaniowe/stopy-procentowe/wibor").then(resp => resp.toString('utf-8')).then(async html => {
                const rates = [...html.matchAll(irPattern)].map((match) => { return { period: match [1], interestRate: match [2].replace(',', '.'), delta: match [3].replace(',', '.') }})
                return {
                    ...Object.fromEntries(rates.map(rate => { return [rate.period, { ir: rate.interestRate, delta: rate.delta }] })),
                    "date": datePattern.test(html) ? html.match(datePattern) [1] : "",
                }
            })
        })
    }
}
