import { CacheAgeUnit, DataSourceDefinition } from "../lib"

export const source: DataSourceDefinition<any> = {
    dependencies: ['a', 'b'],
    cron: "0 10 * * *",
    id: 'c',

    expired: snapshot => snapshot.age(CacheAgeUnit.SECONDS) > 5,
    worker: async (a, b): Promise<any> => {
        return `(a: ${a}, b: ${b}, c: c)`
    }
}
