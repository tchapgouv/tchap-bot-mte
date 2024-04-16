import {Request, Response} from "express";
import webhookService from "../services/webhook.service.js";
import {Webhook} from "../models/webhook.model.js";
import {StatusCodes} from "http-status-codes";
import logger from "../utils/logger.js";

export async function destroy(req: Request, res: Response) {

    const webhookId = req.body.webhook

    await webhookService.destroy(webhookId)
        .then(_status => {
            // console.log(status)
            res.json({
                message: {
                    type: 'success',
                    title: 'Webhook supprimé',
                    description: 'Webhook supprimé avec succès (' + webhookId + ')'
                }
            });
        })
        .catch(err => {
            logger.error("Error deleting webhook :", err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                message:
                    err.message || "Some error occurred while deleting webhook."
            });
        });
}

export async function findAll(req: Request, res: Response) {

    await webhookService.findAll()
        .then(data => {
            return res.send(data);
        })
        .catch(err => {
            logger.error("Error searching webhooks :", err)
            res.statusCode = StatusCodes.INTERNAL_SERVER_ERROR
            res.send({
                message:
                    err.message || "Some error occurred while retrieving webhooks."
            });
        });
}

export async function findOneWithWebhook(req: Request, res: Response) {

    const webhook_id = req.body.webhook

    await webhookService.findOneWithWebhookId(webhook_id)
        .then(data => {

            res.send(data);

        }).catch(err => {
            logger.error("Error searching webhook :", err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                message:
                    err.message || "Some error occurred while retrieving webhook."
            });
        });

}

export async function postMessage(req: Request, res: Response) {

    const webhookId: string = req.params.webhook || req.body.webhook
    const format: string = req.body.messageformat || req.body.message_format || undefined
    const message: string = req.body.message || req.body.text

    let webhook: Webhook | null | undefined

    await webhookService.findOne({where: {webhook_id: webhookId}}).then((value) => {
        webhook = value
    })

    if (!webhook) {
        res.status(StatusCodes.UNAUTHORIZED).send({
            message:
                "Unauthenticated (Wrong webhook)."
        })

    } else if (!message) {
        logger.warning("Someone is trying to post an empty message", req.body)
        res.status(StatusCodes.BAD_REQUEST).send({
            message:
                "'message' property is undefined, maybe body is not respecting { 'message' : 'Hi !' } ?"
        })
    } else {
        await webhookService.postMessage(webhook, message, format)
            .then(data => {
                res.json(data)
            })
            .catch(err => {
                logger.error("Error posting message :", err)
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                    message:
                        err.message || "Some error occurred while posting message."
                });
            });
    }

}

export async function update(req: Request, res: Response) {

    const webhook = {
        webhook_label: req.body.webhook.webhook_label,
        room_id: req.body.webhook.room_id,
        script: req.body.webhook.script,
    }

    await webhookService.update(req.body.webhook.webhook_id, webhook)
        .then(_data => {
            res.send({
                'message': {
                    type: 'success',
                    title: 'Enregistrement',
                    description: 'Webhook sauvé avec succès',
                }
            });
        })
        .catch(err => {
            logger.error("Error updating webhook :", err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                message:
                    err.message || "Some error occurred while saving webhook."
            });
        });
}

export async function create(req: Request, res: Response) {

    if (!req.body.room) {
        res.status(StatusCodes.BAD_REQUEST).send({
            message: "Room id can not be empty!"
        });
        return;
    }

    await webhookService.create(
        req.body.label,
        req.body.room,
        req.body.bot_id
    )
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            logger.error("Error creating webhook :", err)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                message:
                    err.message || "Some error occurred while creating webhook."
            });
        });

}
