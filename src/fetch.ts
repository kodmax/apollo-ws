import { IncomingMessage } from "http";
import { request } from "https";
import { URL } from "url";


export class FetchError<T> extends Error {
    public constructor(message: string, public res?: IncomingMessage, public content?: T) {
        super(message);
    }
}

export async function fetch (url: string, extraHeaders: Record<string, string> = {}): Promise<Buffer> {
    const chunks: Buffer[] = []
    const purl = new URL(url)

    const headers = {
        'accept': 'application/json, */*',
        'accept-encoding': 'identity',
        'user-agent': 'Apollo/ws',
        'connection': 'close',
        'host': purl.host,
        ...extraHeaders
    }

    return new Promise((resolve, reject) => {
        const req = request({ protocol: purl.protocol, hostname: purl.hostname, path: `${purl.pathname}${purl.search}`, port: purl.port, headers }, res => {
            res.on("data", chunk => {
                chunks.push(chunk)
            });

            res.on("end", () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(Buffer.concat(chunks));

                } else {
                    reject(new FetchError<Buffer>(`Downloading ${url} failed: ${res.statusCode} ${res.statusMessage}`, res, Buffer.concat(chunks)));
                }
            });
        });

        req.on("error", err => {
            reject(err);
        });

        req.end();
    });
}
