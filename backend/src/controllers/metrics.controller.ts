import {Request, Response} from "express";
import metricService from "../services/metric.service.js";
import * as os from "node:os";

export async function fetchMetrics(req: Request, res: Response) {

    const preserve = !!req.query.preserve;

    let prometheusFormattedMetrics = await metricService.getPrometheusFormattedMetrics()
    if (!preserve) metricService.purge()

    const hostname = os.hostname()

    return res.type('text/plain').send(
        `status{state="OK", hostname="${hostname}"} 1\n` +
        prometheusFormattedMetrics);
}
