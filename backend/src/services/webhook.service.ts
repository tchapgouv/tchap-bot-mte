import {Request, Response} from "express";
import {Attributes, FindOptions} from "sequelize/lib/model";
import sequelize from "../models/index.js";
import {Webhook} from "../models/webhook.model.js";

const webhookRepository = sequelize.getRepository(Webhook)


// Create and Save a new Webhook
function create(req: Request, res: Response) {
    if (!req.body.room) {
        res.sendStatus(400).send({
            message: "Room id can not be empty!"
        });
        return;
    }

    // Create a Webhook
    const webhook:Attributes<Webhook> = {
        webhook_id: generateId(100),
        webhook_label: req.body.label,
        room_id: req.body.room,
        script: '// Il est possible de manipuler la variable data (le message), qui sera récupérée et envoyée au bot à la fin du traitement.\ndata = data;'
    };

    // Save Webhook in the database
    webhookRepository.create(webhook)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.sendStatus(500).send({
                message:
                    err.message || "Some error occurred while creating webhook."
            });
        });
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
