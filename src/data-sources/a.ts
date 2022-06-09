import { CacheAgeUnit, DataSourceDefinition } from "../lib"

export const source: DataSourceDefinition<any> = {
    dependencies: [],
    cron: "15 * * * *",
    volatile: true,
    id: 'a',

    expired: snapshot => snapshot.age(CacheAgeUnit.SECONDS) > 5,
    worker: async (b): Promise<any> => {
        return `a`
    },
    update: push => {
        setInterval(() => push(Math.random()), 3000)
    }
}
