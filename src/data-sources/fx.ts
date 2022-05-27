
import { CacheEntry, Data, DataSource } from "../lib"
import * as apiKeys from "./.secrets/api-keys.json"
import { Fetch } from "./fetch"
import { URL } from "url"

export const source: DataSource = {
    cron: "0 */3 * * *",

    worker: async (cache: CacheEntry): Promise<Data> => {
        return cache.refresh(entry => CacheEntry.age(entry) < 60, async () => {
            return new Fetch(new URL("https://api.apilayer.com"), { apikey: apiKeys ["fixer.io"] }).fetch("/exchangerates_data/latest?symbols=GBP%2CEUR%2CUSD%2CCHF%2CBTC%2CXAU%2CPLN&base=EUR").then(response => JSON.parse(response.toString('utf-8'))).then(async resp => {
                if (resp.success) {
                    return {
                        "timestamp": resp.timestamp,
                        "base": resp.base,
                        
                        "BTC/USD": Number(resp.rates.PLN/resp.rates.BTC*resp.rates.USD).toFixed(4),
                        "XAU/USD": Number(resp.rates.PLN/resp.rates.XAU*resp.rates.USD).toFixed(4),
            
                        "EUR/PLN": Number(resp.rates.PLN/resp.rates.EUR).toFixed(4),
                        "USD/PLN": Number(resp.rates.PLN/resp.rates.USD).toFixed(4),
                        "CHF/PLN": Number(resp.rates.PLN/resp.rates.CHF).toFixed(4),
                        "GBP/PLN": Number(resp.rates.PLN/resp.rates.GBP).toFixed(4),
                    }
        
                } else {
                    throw new Error(resp.error)
                }
            })
        })
    }
}
