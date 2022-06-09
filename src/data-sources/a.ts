import { CacheAgeUnit, DataSourceDefinition } from "../lib"

export const source: DataSourceDefinition<any> = {
    dependencies: [],
    cron: "15 * * * *",
    id: 'a',

    expired: snapshot => snapshot.age(CacheAgeUnit.SECONDS) > 5,
    worker: async (b): Promise<any> => {
        return `a`
    }
}
