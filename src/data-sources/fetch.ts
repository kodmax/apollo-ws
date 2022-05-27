import { IncomingMessage } from "http";
import { request } from "https";
import { URL } from "url";


export class FetchError<T> extends Error {
    public constructor(message: string, public res?: IncomingMessage, public content?: T) {
        super(message);
    }
}

export class Fetch {
    public constructor(private baseUrl?: URL, private headers: Record<string, string> = {}) {
        // nothing here
    }

    public async fetch(path: URL["pathname"], accept: string = "*/*"): Promise<Buffer> {
        const url = new URL(path, this.baseUrl);
        const chunks: Buffer[] = []

        return new Promise((resolve, reject) => {
            const req = request({ protocol: url.protocol, hostname: url.hostname, path: url.pathname, port: url.port, headers: { ...this.headers, accept } }, res => {
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
}
