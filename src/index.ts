import { fuel, fx, oil, torrents, weather, wibor } from "./data-sources"
import { ApolloWebSocket, Cache, CacheEntry } from "./lib";
import { KnxLink } from "js-knx"
import { energy, airQuality } from "./home.knx-schema"

new ApolloWebSocket({ cache: new Cache(__dirname + '/data-sources/.cache') }, apollo => {
    apollo.addDataSource('torrents', torrents)
    apollo.addDataSource('weather', weather)
    apollo.addDataSource('wibor', wibor)
    apollo.addDataSource('fuel', fuel)
    apollo.addDataSource('oil', oil)
    apollo.addDataSource('fx', fx)

    apollo.addFeed('top-torrents', ['torrents'], () => {
        return async () => apollo.getData('torrents').content.slice(0, 10).map(torrent => {
            return { magnet: torrent.info_hash, title: torrent.name, size: torrent.size }
        })
    })

    apollo.addFeed('weather-forecast', ['weather'], () => {
        return async () => apollo.getData('weather').content
    })

    apollo.addFeed('wibor', ['wibor'], () => {
        return async () => apollo.getData('wibor').content
    })

    apollo.addFeed('fuel', ['fuel'], () => {
        return async () => apollo.getData('fuel').content
    })

    apollo.addFeed('oil', ['oil', 'fx'], () => {
        return async () => {
            const [ date, usdPerBarrel ] = apollo.getData('oil').content.dataset.data [0]
            const er = apollo.getData('fx').content["USD/PLN"]
            return {
                "PLN/l": Number(usdPerBarrel / 159 * er).toFixed(2),
                "USD/bbl": Number(usdPerBarrel).toFixed(2),
                "date": date,
            }
        }
            
    })

    apollo.addFeed('fx', ['fx'], () => {
        return async () => apollo.getData('fx').content
    })

    KnxLink.connect("192.168.0.8").then(knx => {
        knx.getDatapoint(energy.InstantPowerDraw.reading, dp => {
            apollo.addFeed("home.power-draw", [], (update, cache) => {
                dp.addValueListener(reading => {
                    cache.write(reading)
                    update(reading)
                })
    
                return async () => {
                    return (await cache.refresh(entry => CacheEntry.age(entry) < 3, async () => await dp.read())).content
                }
            })    
        })

        knx.getDatapoint(energy["Intermediate Consumption Meter"].Reading, dp => {
            apollo.addFeed("home.energy-consumption.today", [], (update, cache) => {
                dp.addValueListener(reading => {
                    cache.write(reading)
                    update(reading)
                })
    
                return async () => {
                    return (await cache.refresh(entry => CacheEntry.age(entry) < 3, async () => await dp.read())).content
                }
            })    
        })

        knx.getDatapoint(airQuality.CO2.reading, dp => {
            apollo.addFeed("home.air-quality.co2", [], (update, cache) => {
                dp.addValueListener(reading => {
                    cache.write(reading)
                    update(reading)
                })
    
                return async () => {
                    return (await cache.refresh(entry => CacheEntry.age(entry) < 3, async () => await dp.read())).content
                }
            })    
        })

        process.on('SIGINT', () => {
            knx.disconnect().then(() => process.exit(0))
        })
    })
})
