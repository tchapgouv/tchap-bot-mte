import {Request, Response} from "express";
import {Attributes, FindOptions} from "sequelize/lib/model";
import sequelize from "../models/index.js";
import {Webhook} from "../models/webhook.model.js";
import logger from "../utils/logger.js";
import {applyScriptAndPostMessage} from "./bot.service.js";

export function postMessage(req: Request, res: Response) {

    const webhook = req.params.webhook || req.body.webhook

    findOne({where: {webhook_id: webhook}}).then((webhook) => {

        if (!webhook) throw "Some error occurred while retrieving webhook"

        logger.debug("Posting from webhook : ", webhook)

        const room_id = webhook.dataValues.room_id
        const script = webhook.dataValues.script
        const format = req.body.messageformat || req.body.message_format || undefined

        applyScriptAndPostMessage(room_id,
            req.body.message,
            script,
            {messageFormat: format}).then(data => {
            res.json(data)
        })
            .catch(err => {
                res.status(500).send({
                    message:
                        err.message || "Some error occurred while posting message."
                });
            });
    })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while fetching webhook."
            });
        });
}


const webhookRepository = sequelize.getRepository(Webhook)


// Create and Save a new Webhook
function create(webhook_label: string,
                room_id: string,
                script: string = '// Il est possible de manipuler la variable data (le message), qui sera récupérée et envoyée au bot à la fin du traitement.\ndata = data;'): Promise<Webhook> {

    return new Promise((resolve, reject) => {
        // Create a Webhook
        const webhook: Attributes<Webhook> = {
            webhook_id: generateId(100),
            webhook_label: webhook_label,
            room_id: room_id,
            script: script
        };

        // Save Webhook in the database
        webhookRepository.create(webhook)
            .then(data => {
                resolve(data);
            })
            .catch(err => {
                reject(err.message || "Some error occurred while creating webhook.")
            });

    })
}

function destroy(req: Request, res: Response) {

    const webhookId = req.body.webhook

    return webhookRepository.destroy({where: {webhook_id: webhookId}})
        .then(_status => {
            // console.log(status)
            res.status(200).json({
                message: {
                    type: 'success',
                    title: 'Webhook supprimé',
                    description: 'Webhook supprimé avec succès (' + webhookId + ')'
                }
            });
        })
        .catch(err => {
            // console.log(err)
            res.sendStatus(500).send({
                message:
                    err.message || "Some error occurred while deleting webhook."
            });
        });
}

// Retrieve all Webhooks from the database.
function findAll(req: Request, res: Response) {

    webhookRepository.findAll()
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.statusCode = 500
            res.send({
                message:
                    err.message || "Some error occurred while retrieving webhooks."
            });
        });
}

async function update(req: Request, res: Response) {

    const webhook = await webhookRepository.findOne({where: {webhook_id: req.body.webhook.webhook_id}})

    if (!webhook) {
        res.sendStatus(500).send({
            message: "Provided Webhook was not found."
        });
        return
    }

    webhook.set({
        webhook_label: req.body.webhook.webhook_label,
        room_id: req.body.webhook.room_id,
        script: req.body.webhook.script,
    })

    webhook.save().then(_data => {
        res.send({
            'message': {
                type: 'success',
                title: 'Enregistrement',
                description: 'Webhook sauvé avec succès',
            }
        });
    })
        .catch(err => {
            res.sendStatus(500).send({
                message:
                    err.message || "Some error occurred while saving webhook."
            });
        });
}

async function findOne(criteria: FindOptions) {

    return await webhookRepository.findOne(criteria).then(data => {
        return data;
    })
}

// Retrieve all Webhooks from the database.
function findOneWithWebhook(req: Request, res: Response) {

    // console.log(req.body)

    findOne({where: {webhook_id: req.body.webhook}}).then(data => {
        res.send(data);
    })
        .catch(err => {
            res.sendStatus(500).send({
                message:
                    err.message || "Some error occurred while retrieving webhook."
            });
        });
}

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

export {create, findAll, findOneWithWebhook, destroy, update, findOne}
