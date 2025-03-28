import fetch, {RequestInit} from 'node-fetch';
import {HttpsProxyAgent} from 'https-proxy-agent';
import logger from "./logger.js";

export default function (url: string, opts: { requestInit?: RequestInit, timeout?: number, proxify?: boolean, proxy?: string } = {}): Promise<any> {

    if (opts.requestInit === undefined) opts.requestInit = {method: "GET", signal: AbortSignal.timeout(opts.timeout ? opts.timeout : 7000)}
    if (opts.proxify === undefined) opts.proxify = false

    if (opts.proxify) {
        const proxy = opts.proxy ? opts.proxy : process.env.PROXY_URL
        logger.debug("proxy = " + proxy)
        opts.requestInit.agent = proxy ? new HttpsProxyAgent(proxy, {}) : undefined
    }

    opts.requestInit.method = opts.requestInit.method ? opts.requestInit.method : "GET"

    return fetch(url, opts.requestInit)
}
