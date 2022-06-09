import { CacheAgeUnit, DataSourceDefinition } from "../lib"

export const source: DataSourceDefinition<any> = {
    dependencies: [],
    cron: "0 */6 * * *",
    id: 'b',

    expired: snapshot => snapshot.age(CacheAgeUnit.SECONDS) > 5,
    worker: async (): Promise<any> => {
        return `b`
    }
}
