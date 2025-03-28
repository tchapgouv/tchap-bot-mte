import {Request, Response} from "express";
import webhookService from "../services/webhook.service.js";
import {Webhook} from "../models/webhook.model.js";
import {StatusCodes} from "http-status-codes";
import logger from "../utils/logger.js";
import botService from "../services/bot.service.js";
import metricService, {MetricLabel} from "../services/metric.service.js";
import {isRequestFromInternet} from "./auth.controller.js";

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

    logger.debug("Webhook posting request received.")

    const webhookId: string = req.params.webhook || req.body.webhook
    let format: string = req.body.messageformat || req.body.message_format || undefined
    let message: string | any = req.body.message || req.body.text || req.body
    let rawMessage: string =
        req.body.rawmessage || req.body.raw_message || req.body.message_raw || req.body.messageraw ||
        req.body.rawtext || req.body.raw_text || req.body.text_raw || req.body.textraw ||
        undefined

    let webhook: Webhook | null | undefined

    await webhookService.findOne({where: {webhook_id: webhookId}}).then((value) => {
        webhook = value
        logger.debug("Webhook :", webhook)
    }).catch(_ => {

        metricService.createOrIncrease(
            {
                name: "webhook",
                labels: [
                    new MetricLabel("status", "UNAUTHORIZED"),
                    new MetricLabel("method", "post"),
                    new MetricLabel("reason", "Wrong webhook")
                ]
            })

        res.status(StatusCodes.UNAUTHORIZED).send({
            message:
                "Unauthenticated (Wrong webhook)."
        })
        return
    })

    if (!webhook) {

        metricService.createOrIncrease(
            {
                name: "webhook",
                labels: [
                    new MetricLabel("status", "UNAUTHORIZED"),
                    new MetricLabel("method", "post"),
                    new MetricLabel("reason", "Wrong webhook")
                ]
            })

        res.status(StatusCodes.UNAUTHORIZED).send({
            message:
                "Unauthenticated (Wrong webhook)."
        })
        return
    }

    if (isRequestFromInternet(req) && !webhook.dataValues.internet) {
        metricService.createOrIncrease(
            {
                name: "webhook",
                labels: [
                    new MetricLabel("status", "UNAUTHORIZED"),
                    new MetricLabel("method", "post"),
                    new MetricLabel("reason", "Internet origin not allowed")
                ]
            })

        res.status(StatusCodes.UNAUTHORIZED).send({
            message:
                "Unauthorized."
        })
        return
    }

    logger.info("Applying script to message")

    logger.debug('Message before script : ', message);
    logger.debug('script : ', webhook.dataValues.script)
    await botService.runScript(webhook.dataValues.script, message).then(data => {
        logger.debug('Script applied.')
        logger.debug('Resulting data :', data)
        if (typeof data === 'string') message = data
        if (data.message && typeof data.message === 'string') message = data.message
        if (data.rawMessage && typeof data.rawMessage === 'string') rawMessage = data.rawMessage
        if (data.format && typeof data.format === 'string') format = data.format
    }).catch(reason => {
        logger.warning('An error occurred while applying script.', webhook?.dataValues.webhook_id, reason)
    })
    logger.debug('Message after script : ', message);

    if (typeof message !== 'string') {

        logger.warning("Someone is trying to post an empty message", req.body)
        res.status(StatusCodes.BAD_REQUEST).send({
            message:
                "'message' property is undefined, maybe body is not respecting { 'message' : 'Hi !' } ?"
        })
        return
    }

    metricService.createOrIncrease(
        {
            name: "webhook",
            labels: [
                new MetricLabel("status", "AUTHORIZED"),
                new MetricLabel("method", "post"),
                new MetricLabel("bot_id", webhook.getDataValue("bot_id")),
                new MetricLabel("room_id", webhook.getDataValue("room_id")),
                new MetricLabel("webhook_id", webhook.getDataValue("webhook_id")),
                new MetricLabel("webhook_label", webhook.getDataValue("webhook_label")),
                new MetricLabel("format", format)
            ]
        })

    await webhookService.postMessage(webhook, {formattedMessage: message, rawMessage: rawMessage}, format)
        .then(data => {
            res.json(data)
        })
        .catch(err => {
            logger.error("Error posting message :", err)
            metricService.createOrIncrease({
                name: "error",
                labels: [new MetricLabel("reason", "Error posting message")]
            })
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                message:
                    err.message || "Some error occurred while posting message."
            });
        });
}

export async function check(req: Request, res: Response) {

    if (!req.body.webhook_id) {
        res.status(StatusCodes.BAD_REQUEST).send({
            message: "Webhook id can not be empty!"
        });
        return;
    }


    await webhookService.check(req.body.webhook_id).then(value => {

        let reasons: string[] = []
        if (!value.isBotMemberOfRoom) reasons.push('Bot non membre')

        res.send({hasError: value.hasError, reason: reasons.join(", ")})
    })
}

export async function update(req: Request, res: Response) {

    const webhook = {
        webhook_label: req.body.webhook.webhook_label,
        room_id: req.body.webhook.room_id,
        bot_id: req.body.webhook.bot_id,
        internet: req.body.webhook.internet,
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

export async function uploadFile(req: Request, res: Response) {

    logger.debug("Webhook upload request received.", req.files)

    if (!req.files) {
        res.status(400).send('No file were uploaded');
        return;
    }

    const webhookId: string = req.params.webhook || req.body.webhook
    let webhook: Webhook | null | undefined

    await webhookService.findOne({where: {webhook_id: webhookId}}).then((value) => {
        webhook = value
        logger.debug("Webhook :", webhook)
    }).catch(_ => {

        metricService.createOrIncrease(
            {
                name: "webhook",
                labels: [
                    new MetricLabel("status", "UNAUTHORIZED"),
                    new MetricLabel("method", "upload"),
                    new MetricLabel("reason", "Wrong webhook")
                ]
            })

        res.status(StatusCodes.UNAUTHORIZED).send({
            message:
                "Unauthenticated (Wrong webhook)."
        })
        return
    })

    if (!webhook) {

        metricService.createOrIncrease(
            {
                name: "webhook",
                labels: [
                    new MetricLabel("status", "UNAUTHORIZED"),
                    new MetricLabel("method", "upload"),
                    new MetricLabel("reason", "Wrong webhook")
                ]
            })

        res.status(StatusCodes.UNAUTHORIZED).send({
            message:
                "Unauthenticated (Wrong webhook)."
        })
        return
    }

    if (isRequestFromInternet(req) && !webhook.dataValues.internet) {
        metricService.createOrIncrease(
            {
                name: "webhook",
                labels: [
                    new MetricLabel("status", "UNAUTHORIZED"),
                    new MetricLabel("method", "upload"),
                    new MetricLabel("reason", "Internet origin not allowed")
                ]
            })

        res.status(StatusCodes.UNAUTHORIZED).send({
            message:
                "Unauthorized."
        })
        return
    }

    let uploadedFile = Object.values(req.files)[0];
    if (Array.isArray(uploadedFile)) {
        uploadedFile = uploadedFile[0];
    }

    logger.debug(`File Name: ${uploadedFile.name}`);
    logger.debug(`File Size: ${uploadedFile.size}`);
    logger.debug(`File MD5 Hash: ${uploadedFile.md5}`);
    logger.debug(`File Mime Type: ${uploadedFile.mimetype}`);

    // uploadedFile.mv("/tchap-bot-workdir/data/upload/" + uploadedFile.name)
    //     .then(_ => {
    //         logger.notice("File moved.")
    //     })
    //     .catch(reason => {
    //         logger.error("Cannot copy file to temporary directory :", reason)
    //     })

    if (webhook) {

        metricService.createOrIncrease(
            {
                name: "webhook",
                labels: [
                    new MetricLabel("status", "AUTHORIZED"),
                    new MetricLabel("method", "upload"),
                    new MetricLabel("bot_id", webhook.getDataValue("bot_id")),
                    new MetricLabel("room_id", webhook.getDataValue("room_id")),
                    new MetricLabel("webhook_id", webhook.getDataValue("webhook_id")),
                    new MetricLabel("webhook_label", webhook.getDataValue("webhook_label")),
                ]
            })

        botService.upload(
            webhook.dataValues.room_id,
            uploadedFile.data,
            {
                mimeType: uploadedFile.mimetype,
                fileName: uploadedFile.name,
                height: req.query.height && typeof req.query.height === 'string' ? Number.parseInt(req.query.height) : undefined,
                width: req.query.width && typeof req.query.width === 'string' ? Number.parseInt(req.query.width) : undefined
            })
            .then(value => {
                if (value.uri !== "")
                    res.status(StatusCodes.OK).json(value)
                else
                    res.status(StatusCodes.BAD_REQUEST).json(value)
            })
    }
}
