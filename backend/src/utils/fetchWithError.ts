import fetch, {RequestInit} from 'node-fetch';
import {HttpsProxyAgent} from 'https-proxy-agent';

export default function (url: string, opts: { requestInit?: RequestInit, timeout?: number, proxify?: boolean , proxy?: string } = {}): Promise<any> {

    if (!opts.requestInit) opts.requestInit = {method: "GET"}
    if (!opts.timeout) opts.timeout = 7000
    if (!opts.proxify) opts.proxify = false

    if (opts.proxify) {
        const proxy = opts.proxy ? opts.proxy : process.env.PROXY_URL
        opts.requestInit.agent = proxy ? new HttpsProxyAgent(proxy) : undefined
    }
    opts.requestInit.method = opts.requestInit.method ? opts.requestInit.method : "GET"

    return Promise.race([
        fetch(url, opts.requestInit),
        new Promise((_resolve, reject) =>
            setTimeout(() => reject(new Error('timeout')), opts.timeout)
        )
    ])
}
