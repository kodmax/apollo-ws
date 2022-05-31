const tablePattern = /<div class="col-md-7">\s*<h2 class="primary-header">Ostatnie ceny <strong>(.*)<\/strong><\/h2>\s*<div class="table-responsive">\s*<table class="last-prices-table">([\s\S]*?)<\/table>/g
const pricePattern = /<tr>\s*<td class="date">([\d.]+)<\/td>\s*<td class="address">([\s\S]+?)<td class="prize">([\d,]+) zł<\/td>\s*<\/tr>/g

import { CacheEntry, Data, DataSource } from "../lib"
import { JSDOM } from "jsdom"
import { fetch } from "../fetch"


export const source: DataSource = {
    cron: "0 10 * * *",
    
    worker: async (cache: CacheEntry): Promise<Data> => {
        return cache.refresh(entry => CacheEntry.age(entry) < 60, async () => {
            return await fetch(`https://www.autocentrum.pl/stacje-paliw/bp/`, { accept: 'text/html' }).then(resp => resp.toString('utf-8')).then(async html => {
                const document = new JSDOM(html).window.document

                const prices = Object.fromEntries(
                    Array.from(document.querySelectorAll('.last-prices-wrapper .row'))
                    .map(row => { return { type: row.querySelector('.primary-header strong').textContent, entries: Array.from(row.querySelectorAll('.table-responsive tbody tr')) } })
                    .map(({ type, entries }) => {return { type, tr: Array.from(entries)[0] }})
                    .map(({ type, tr }) => { return [ type, { price: tr.querySelector('td.prize').textContent.replace(',', '.').replace(' zł', ''), date: tr.querySelector('td.date').textContent  } ] })
                    )
            
                return prices
            })
        })
    }
}
