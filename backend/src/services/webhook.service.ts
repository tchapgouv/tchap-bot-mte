import {Attributes, FindOptions} from "sequelize/lib/model";
import sequelize from "../models/index.js";
import {Webhook} from "../models/webhook.model.js";
import logger from "../utils/logger.js";
import botService from "./bot.service.js";

const webhookRepository = sequelize.getRepository(Webhook)

function generateId(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

export default {

    async postMessage(webhook: Webhook, message: { formattedMessage: string; rawMessage: string | undefined }, messageFormat: string = "") {

        logger.debug("Posting from webhook : ", webhook.dataValues.webhook_id)

        webhook.set({lastUseEpoch: Date.now()})
        webhook.save().catch(reason => {
            logger.error("Error updating webhook's lastUseEpoch :", reason)
        })

        return await botService.postMessage(webhook.dataValues.room_id,
            message,
            webhook.dataValues.bot_id,
            {messageFormat: messageFormat})
    },


// Create and Save a new Webhook
    async create(webhook_label: string,
                 room_id: string,
                 bot_id: string,
                 script: string = '// Il est possible de manipuler la variable data (le message), qui sera récupérée et envoyée au bot à la fin du traitement.\ndata = data;'): Promise<Webhook> {

        // Create a Webhook
        const webhookPojo: Attributes<Webhook> = {
            webhook_id: generateId(100),
            webhook_label: webhook_label,
            bot_id: bot_id ? bot_id : "" + process.env.BOT_USER_ID,
            room_id: room_id,
            internet: false,
            script: script,
            lastUseEpoch: Date.now()
        };

        let webhook
        // Save Webhook in the database
        await webhookRepository.create(webhookPojo)
            .then(data => {
                webhook = data;
            })
            .catch(err => {
                throw (err.message || "Some error occurred while creating webhook.")
            });

        if (!webhook) throw ("Some error occurred while creating webhook.")

        return webhook
    },

    async destroy(webhookId: string) {

        return await webhookRepository.destroy({where: {webhook_id: webhookId}})
    },

    async findAll() {

        return await webhookRepository.findAll()
    },

    async update(webhookId: string, newWebhook: {
        webhook_label: string,
        room_id: string,
        bot_id: string,
        internet: boolean,
        script: string,
    }) {

        const webhook = await webhookRepository.findOne({where: {webhook_id: webhookId}})

        if (!webhook) {
            throw ({message: "Provided Webhook was not found."})
        }

        webhook.set(newWebhook)

        return await webhook.save()
    },

    async findOne(criteria: FindOptions) {

        return await webhookRepository.findOne(criteria)
    },

    async findOneWithWebhookId(webhookId: string) {

        return await this.findOne({where: {webhook_id: webhookId}})
    }
}
