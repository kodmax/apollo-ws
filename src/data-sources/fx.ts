
import { CacheEntry, Data, DataSource } from "../lib"
import * as apiKeys from "./.secrets/api-keys.json"
import { fetch } from "../fetch"


export const source: DataSource = {
    cron: "0 */3 * * *",

    worker: async (cache: CacheEntry): Promise<Data> => {
        return cache.refresh(entry => CacheEntry.age(entry) < 60, async () => {
            return await fetch(`https://api.apilayer.com/exchangerates_data/latest?symbols=GBP%2CEUR%2CUSD%2CCHF%2CBTC%2CXAU%2CPLN&base=EUR`, { apikey: apiKeys ["fixer.io"] }).then(response => JSON.parse(response.toString('utf-8'))).then(async resp => {
                if (resp.success) {
                    return {
                        "timestamp": resp.timestamp,
                        
                        "BTC/USD": Number(resp.rates.USD/resp.rates.BTC*resp.rates.EUR).toFixed(0),
                        "XAU/USD": Number(resp.rates.USD/resp.rates.XAU*resp.rates.EUR).toFixed(0),
            
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
