#!/usr/bin/ts-node
import { fuel, fx, oil, torrents, weather, irs, aqi, news } from "./data-sources"
import { ApolloWebSocket, Cache, CacheEntry } from "./lib";
import { KnxLink } from "js-knx"
import { energy, airQuality, temp } from "./home.knx-schema"

process.setMaxListeners(0)

new ApolloWebSocket({ cache: new Cache(__dirname + '/data-sources/.cache')}, async apollo => {
    apollo.addSysLogListener(msg => console.log(msg))

    apollo.addDataSource('torrents', torrents)
    apollo.addDataSource('weather', weather)
    apollo.addDataSource('irs', irs)
    apollo.addDataSource('fuel', fuel)
    apollo.addDataSource('news', news)
    apollo.addDataSource('aqi', aqi)
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

    apollo.addFeed('irs', ['irs'], () => {
        return async () => apollo.getData('irs').content
    })

    apollo.addFeed('fuel', ['fuel'], () => {
        return async () => apollo.getData('fuel').content
    })

    apollo.addFeed('news', ['news'], () => {
        return async () => apollo.getData('news').content
    })

    apollo.addFeed('aqi', ['aqi'], () => {
        return async () => apollo.getData('aqi').content
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
        const nettoCostPer1Kwh = 0.68
        const vat = 1.23

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

        knx.getDatapoint(airQuality.Wilgotność.reading, dp => {
            apollo.addFeed("home.air-quality.humidity", [], (update, cache) => {
                dp.addValueListener(reading => {
                    cache.write(reading)
                    update(reading)
                })
    
                return async () => {
                    return (await cache.refresh(entry => CacheEntry.age(entry) < 3, async () => await dp.read())).content
                }
            })    
        })

        knx.getDatapoint(airQuality.Wilgotność.reading, dp => {
            apollo.addFeed("home.air-quality.humidity", [], (update, cache) => {
                dp.addValueListener(reading => {
                    cache.write(reading)
                    update(reading)
                })
    
                return async () => {
                    return (await cache.refresh(entry => CacheEntry.age(entry) < 3, async () => await dp.read())).content
                }
            })    
        })

        knx.getDatapoint(energy["Power Factor tg φ"].reading, dp => {
            apollo.addFeed("home.energy.power-factor", [], (update, cache) => {
                dp.addValueListener(reading => {
                    cache.write(reading)
                    update(reading)
                })
    
                return async () => {
                    return (await cache.refresh(entry => CacheEntry.age(entry) < 3, async () => await dp.read())).content
                }
            })    
        })

        knx.getDatapoint(energy["Passive Power"].reading, dp => {
            apollo.addFeed("home.energy.passive-power", [], (update, cache) => {
                dp.addValueListener(reading => {
                    cache.write(reading)
                    update(reading)
                })
    
                return async () => {
                    return (await cache.refresh(entry => CacheEntry.age(entry) < 3, async () => await dp.read())).content
                }
            })    
        })

        knx.getDatapoint(energy["Voltage"].reading, dp => {
            apollo.addFeed("home.energy.voltage", [], (update, cache) => {
                dp.addValueListener(reading => {
                    cache.write(reading)
                    update(reading)
                })
    
                return async () => {
                    return (await cache.refresh(entry => CacheEntry.age(entry) < 3, async () => await dp.read())).content
                }
            })    
        })

        knx.getDatapoint(temp["Podloga lazienka temperatura"], dp => {
            apollo.addFeed("home.temp.bathroom-floor", [], (update, cache) => {
                dp.addValueListener(reading => {
                    cache.write(reading)
                    update(reading)
                })
    
                return async () => {
                    return (await cache.refresh(entry => CacheEntry.age(entry) < 3, async () => await dp.read())).content
                }
            })    
        })

        knx.getDatapoint(temp["Lazienka"], dp => {
            apollo.addFeed("home.temp.bathroom", [], (update, cache) => {
                dp.addValueListener(reading => {
                    cache.write(reading)
                    update(reading)
                })
    
                return async () => {
                    return (await cache.refresh(entry => CacheEntry.age(entry) < 3, async () => await dp.read())).content
                }
            })    
        })

        knx.getDatapoint(temp["Sypialnia przy loggi"], dp => {
            apollo.addFeed("home.temp.bedroom", [], (update, cache) => {
                dp.addValueListener(reading => {
                    cache.write(reading)
                    update(reading)
                })
    
                return async () => {
                    return (await cache.refresh(entry => CacheEntry.age(entry) < 3, async () => await dp.read())).content
                }
            })    
        })

        knx.getDatapoint(temp["Salon sofa"], dp => {
            apollo.addFeed("home.temp.livingroom", [], (update, cache) => {
                dp.addValueListener(reading => {
                    cache.write(reading)
                    update(reading)
                })
    
                return async () => {
                    return (await cache.refresh(entry => CacheEntry.age(entry) < 3, async () => await dp.read())).content
                }
            })    
        })

        process.on('SIGTERM', () => {
            knx.disconnect().then(() => process.exit(0))
            console.log('SIGTERM. Exiting.')
        })

        console.log('Apollo websocket started.')
    })
})    
