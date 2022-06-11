import { CronDayOfWeek, decode } from "./decode"

describe('Chronos decode', () => {

    it('numeric element', () => {
        expect(decode(`4`, 0, 6, CronDayOfWeek)).toStrictEqual([ 4 ])
    })

    it('multiple numeric elements', () => {
        expect(decode(`1,0,3`, 0, 6, CronDayOfWeek)).toStrictEqual([ 1, 0, 3 ])
    })

    it('named element', () => {
        expect(decode(`Sun`, 0, 6, CronDayOfWeek)).toStrictEqual([ 0 ])
    })

    it('multiple named elements', () => {
        expect(decode(`Fri,Mon,Sun`, 0, 6, CronDayOfWeek)).toStrictEqual([ 5, 1, 0 ])
    })

    it('numeric range', () => {
        expect(decode(`4-6`, 0, 6, CronDayOfWeek)).toStrictEqual([ 4, 5, 6 ])
    })

    it('named range', () => {
        expect(decode(`Mon-Fri`, 0, 6, CronDayOfWeek)).toStrictEqual([ 1, 2, 3, 4, 5 ])
    })

    it('range with step', () => {
        expect(decode(`1-5/2`, 0, 6, CronDayOfWeek)).toStrictEqual([ 1, 3, 5 ])
    })

    it('number with step', () => {
        expect(decode(`Wed/3`, 0, 6, CronDayOfWeek)).toStrictEqual([ 3, 6 ])
    })
})