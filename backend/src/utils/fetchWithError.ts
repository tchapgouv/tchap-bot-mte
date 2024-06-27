import fetch, {RequestInit} from 'node-fetch';
import {HttpsProxyAgent} from 'https-proxy-agent';
import https from "https";

export default function (url: string, opts: { requestInit?: RequestInit, timeout?: number, proxify?: boolean, proxy?: string, disableSslCheck?: boolean } = {}): Promise<any> {

    if (!opts.requestInit) opts.requestInit = {method: "GET"}
    if (!opts.timeout) opts.timeout = 7000
    if (!opts.proxify) opts.proxify = false
    if (!opts.disableSslCheck) opts.disableSslCheck = false

    if (opts.proxify) {
        const proxy = opts.proxy ? opts.proxy : process.env.PROXY_URL
        opts.requestInit.agent = proxy ? new HttpsProxyAgent(proxy, {rejectUnauthorized: opts.disableSslCheck}) : undefined
    } else if (opts.disableSslCheck) {
        opts.requestInit.agent = new https.Agent({
            rejectUnauthorized: false,
        })
    }
    opts.requestInit.method = opts.requestInit.method ? opts.requestInit.method : "GET"

    return Promise.race([
        fetch(url, opts.requestInit),
        new Promise((_resolve, reject) =>
            setTimeout(() => reject(new Error('timeout')), opts.timeout)
        )
    ])
}
