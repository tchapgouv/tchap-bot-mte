import sequelize from "../models/index.js";
import {Metric} from "../models/metric.model.js";
import {Attributes} from "sequelize/lib/model";
import logger from "../utils/logger.js";

const metricRepository = sequelize.getRepository(Metric)

export class MetricLabel {

    constructor(name: string, value: string) {
        this.name = name;
        this.value = value;
    }

    name: string;
    value: string;

    toString(): string {
        return `${this.name}="${this.value}"`
    }
}

export default {

    async createOrIncrease({name, labels}: { name: string, labels: MetricLabel[] }): Promise<void> {

        const mappedLabels: string = labels.map(value => value.toString()).join(", ")
        const metric = await metricRepository.findOne({where: {name: name, labels: mappedLabels}})

        if (!metric) {
            this.create(name, mappedLabels)
        } else {
            metric.set({count: metric.getDataValue("count") + 1})
            metric.save()
        }
    },

    async getPrometheusFormattedMetrics(): Promise<string> {
        const metrics = await this.findAll()

        return formatMetrics(metrics)
    },

    async findAll(): Promise<Metric[]> {

        return await metricRepository.findAll()
            .catch(err => {
                logger.error(err)
                throw ({message: err.message || "Some error occurred while retrieving users."});
            });

    },

    async create(name: string, labels: string): Promise<any> {

        // Create a Metric
        const metricPojo: Attributes<Metric> = {
            name: name,
            labels: labels,
            count: 1
        };

        let metric
        // Save Metric in the database
        await metricRepository.create(metricPojo)
            .then(data => {
                metric = data;
            })
            .catch(err => {
                throw (err.message || "Some error occurred while creating metricGroupPojo.")
            });

        if (!metric) throw ("Some error occurred while creating metricGroupPojo.")

        return metric
    },

    async purge() {

        metricRepository.update({count: 0}, {where: {}})
        // return await metricRepository.truncate()
    }

}

function formatMetrics(metrics: Metric[]): string {

    let formattedMetrics = ""

    for (const metric of metrics) {
        formattedMetrics += metric.getDataValue("name") + "{" + metric.getDataValue("labels") + "}" + " " + metric.getDataValue("count") + "\n"
    }

    return formattedMetrics
}
