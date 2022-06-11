
export const CronDayOfWeek = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
}

export const CronMonth = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12
}

const pattern = /^\*|\d+$/
export function decode(item: string, min: number, max: number, names: Record<string, number> = {}): number[] {
    const values = []

    console.log('decoding', item, min, max, Object.keys(names))
    for (const [ range, step ] of item.split(',').map(item => item.split('/'))) {
        const [ from, to ] = range === '*' ? [ min, max ] : range.split('-').map(value => names [value]?? +value)
        
        const f = +from
        if (isNaN(f)) {
            throw new Error('Cron invalid element: ' + item)
        }

        if (to !== undefined || step !== undefined) {
            const t = +(to?? max), s = +(step?? 1)
            if (isNaN(t) || isNaN(s)) {
                throw new Error('Cron invalid element: ' + item)
            }
            
            console.log('element', f, t, s)
            for (let i = f; i <= t; i += s) {
                values.push(i)
            }

        } else {
            values.push(from)
        }
    }

    return values
}