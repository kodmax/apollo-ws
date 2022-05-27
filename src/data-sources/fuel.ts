const tablePattern = /<div class="col-md-7">\s*<h2 class="primary-header">Ostatnie ceny <strong>(.*)<\/strong><\/h2>\s*<div class="table-responsive">\s*<table class="last-prices-table">([\s\S]*?)<\/table>/g
const pricePattern = /<tr>\s*<td class="date">([\d.]+)<\/td>\s*<td class="address">([\s\S]+?)<td class="prize">([\d,]+) zł<\/td>\s*<\/tr>/g

import { CacheEntry, Data, DataSource } from "../lib"
import { Fetch } from "./fetch"
import { URL } from "url"

export const source: DataSource = {
    cron: "0 10 * * *",
    
    worker: async (cache: CacheEntry): Promise<Data> => {
        return cache.refresh(entry => CacheEntry.age(entry) < 60, async () => {
            return new Fetch(new URL("https://www.autocentrum.pl")).fetch("/stacje-paliw/bp/").then(resp => resp.toString('utf-8')).then(async html => {
                const prices = {
                    '95': {},
                    'ON': {}
                }
            
                for (const [, type, table ] of html.matchAll(tablePattern)) {
                    if (type in prices) {
                        const [, date, location, price ] = [...table.matchAll(pricePattern)] [0]
                        prices [type] = { date, price: price.replace(',', '.') }
                    }
                }
            
                return prices
            })
        })
    }
}
