import { decode } from "./decode"

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
            when: [decode(nn, 0, 59), decode(hh, 0, 23), decode(dm, 1, 31), decode(mm, 1, 12), decode(dw, 0, 6)],
            state: JobState.IDLE,
            worker
        })
    }
}