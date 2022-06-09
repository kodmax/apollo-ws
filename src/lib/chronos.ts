export type Worker = () => Promise<void>

enum JobState {
    RUNNING,
    ERROR,
    IDLE,
}

type Job = {
    state: JobState,
    when: number[][]
    worker: Worker
}

const pattern = /^\d+|\*(?:\/\d+)?$/
export function decode(item: string, max: number, min: number = 0): number[] {
    const values = []

    for (const element of item.split(',')) {
        const [ value ] = element.match(pattern)

        if (value [0] === '*') {
            if (value.length === 1) {
                for (let i = min; i <= max; i+=1) {
                    values.push(i)
                }

            } else {
                const div = +value.substring(2)
                if (isNaN(div) || div % 1 !== 0 || div < 1 || div > max) {
                    throw new Error('Invalid cron entry: ' + item)
    
                } else {
                    for (let i = min; i <= max; i+=div) {
                        values.push(i)
                    }
                }    
            }

        } else {
            const v = +value
            if (isNaN(v) || v % 1 !== 0 || v < min || v > max) {
                throw new Error('Invalid cron entry: ' + item)

            } else {
                values.push(v)
            }
        }
    }

    return values
}

export class Chronos {
    private readonly interval: number
    private jobs: Job[] = []

    public constructor() {
        this.interval = 60000
        this.next()
    }

    private next(): void {
        setTimeout(() => this.tick(new Date()), this.interval - new Date().getTime() % this.interval)
    }

    private tick(now: Date): void {
        const mm = now.getMonth() + 1
        const nn = now.getMinutes()
        const hh = now.getHours()
        const dm = now.getDate()
        const dw = now.getDay()

        for (const job of this.jobs.filter(job => job.state !== JobState.RUNNING)) {
            if (job.when [0].includes(nn) && job.when [1].includes(hh) && job.when [2].includes(dm) && job.when [3].includes(mm) && job.when [4].includes(dw)) {
                job.worker().then(() => job.state = JobState.IDLE ).catch(() => job.state = JobState.ERROR)
                job.state = JobState.RUNNING
            }
        }

        this.next()
    }

    public addJob(when: string, worker: Worker) {
        const [ nn, hh, dm, mm, dw ] = when.split(/\s/)
        
        this.jobs.push({
            when: [decode(nn, 59), decode(hh, 23), decode(dm, 31, 1), decode(mm, 12, 1), decode(dw, 6)],
            state: JobState.IDLE,
            worker
        })
    }
}