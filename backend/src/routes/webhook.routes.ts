import express from 'express';
import {destroy, findAll, findOne, findOneWithWebhook, update} from "../services/webhook.service.js";
import {create} from "../controllers/webhook.controller.js";
import {applyScriptAndPostMessage} from "../services/bot.service.js";
import {verifyToken} from "../controllers/auth.controller.js";
import logger from "../utils/logger.js";

const webhookRouter = express.Router();

// Create a new Tutorial
webhookRouter.post("/api/webhook/create", verifyToken, create);

webhookRouter.delete("/api/webhook/delete", verifyToken, destroy);
// router.post("/create", create);

// Retrieve all webhooks
webhookRouter.get("/api/webhook/list", verifyToken, findAll);

webhookRouter.post("/api/webhook/get", verifyToken, findOneWithWebhook);

webhookRouter.put("/api/webhook/update", verifyToken, update);

webhookRouter.post("/api/webhook/post/:webhook?", (req, res) => {

    const webhook = req.params.webhook || req.body.webhook

    findOne({where: {webhook_id: webhook}}).then((webhook) => {

        if (!webhook) throw "Some error occurred while retrieving webhook"

        logger.debug("Posting from webhook : ", webhook)

        const room_id = webhook.dataValues.room_id
        const script = webhook.dataValues.script

        applyScriptAndPostMessage(room_id,
            req.body.message,
            script).then(data => {
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
})

export default webhookRouter
