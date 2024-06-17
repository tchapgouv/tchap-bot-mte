import {Request, Response} from "express";
import webhookService from "../services/webhook.service.js";
import {Webhook} from "../models/webhook.model.js";
import {StatusCodes} from "http-status-codes";
import logger from "../utils/logger.js";
import botService from "../services/bot.service.js";

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
        res.status(StatusCodes.UNAUTHORIZED).send({
            message:
                "Unauthenticated (Wrong webhook)."
        })
        return
    })

    if (!webhook) {
        res.status(StatusCodes.UNAUTHORIZED).send({
            message:
                "Unauthenticated (Wrong webhook)."
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

    await webhookService.postMessage(webhook, {formattedMessage: message, rawMessage: rawMessage}, format)
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

export async function uploadFile(req: Request, res: Response) {

    logger.debug("Webhook upload request received.")

    const webhookId: string = req.params.webhook || req.body.webhook
    let webhook: Webhook | null | undefined

    await webhookService.findOne({where: {webhook_id: webhookId}}).then((value) => {
        webhook = value
        logger.debug("Webhook :", webhook)
    }).catch(_ => {
        res.status(StatusCodes.UNAUTHORIZED).send({
            message:
                "Unauthenticated (Wrong webhook)."
        })
        return
    })

    if (!webhook) {
        res.status(StatusCodes.UNAUTHORIZED).send({
            message:
                "Unauthenticated (Wrong webhook)."
        })
        return
    }

    logger.debug(req)
    logger.debug(req.headers)
    logger.debug(req.body)

    const fileName: string = req.body.name

    let data: any[] = [];
    req.on("data", (chunk) => {
        data.push(chunk);
    });

    req.on("end", () => {
        let fileData = Buffer.concat(data);

        const contentType = req.headers["content-type"]

        if (webhook) {
            botService.upload(webhook.dataValues.room_id, fileData, {type: contentType, name: fileName, includeFilename: !!fileData})
                .then(value => {
                    if (value.uri !== "")
                        res.status(StatusCodes.OK).json(value)
                    else
                        res.status(StatusCodes.BAD_REQUEST).json(value)
                })
        }
        // Save to file exemple :
        // fs.writeFile(
        //     path.join(__dirname, "example.pdf"),
        //     fileData,
        //     "base64",
        //     (err) => {
        //         if (err) {
        //             res.statusCode = 500;
        //         }
        //     }
        // );
    });


}
