#!/usr/bin/ts-node
import { a, b, c } from "./data-sources"
import { ApolloWebSocket, Cache } from "./lib";

process.setMaxListeners(0)

new ApolloWebSocket({ cache: new Cache(__dirname + '/data-sources/.cache')}, async apollo => {
    apollo.addSysLogListener(msg => console.log(msg))

    await apollo.addDataSource(a)
    await apollo.addDataSource(b)
    await apollo.addDataSource(c)

    apollo.addFeed('a', [ 'a' ], ([ x ]: any[]) => {
        return x
    })

    apollo.addFeed('b', [ 'b' ], ([ x ]: any[]) => {
        return x
    })

    apollo.addFeed('c', [ 'c' ], ([ x ]: any[]) => {
        return x
    })

    apollo.addFeed('d', ['a', 'b', 'c'], ([ a, b, c ]: any[]) => {
        return [ a, b, c ]
    })
})    
