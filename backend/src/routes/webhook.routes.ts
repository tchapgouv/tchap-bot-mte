import express from 'express';
import {check, create, destroy, findAll, findOneWithWebhook, postMessage, update, uploadFile} from "../controllers/webhook.controller.js";
import {verifyAuth, verifyOrigin} from "../controllers/auth.controller.js";
import fileUpload from "express-fileupload";
import logger from "../utils/logger.js";

const webhookRouter = express.Router();

webhookRouter.post("/api/webhook/create", verifyOrigin, verifyAuth, create);

webhookRouter.delete("/api/webhook/delete", verifyOrigin, verifyAuth, destroy);

webhookRouter.get("/api/webhook/list", verifyOrigin, verifyAuth, findAll);

webhookRouter.post("/api/webhook/check", verifyOrigin, verifyAuth, check);

webhookRouter.post("/api/webhook/get", verifyOrigin, verifyAuth, findOneWithWebhook);

webhookRouter.put("/api/webhook/update", verifyOrigin, verifyAuth, update);

/**
 * @openapi
 * /api/webhook/post/{webhook}:
 *   post:
 *     description: Poster dans un salon via un webhook
 *     parameters:
 *         - in: path
 *           name: webhook
 *           schema:
 *             type: string
 *           required: true
 *           description: ID of the webhook
 *     requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 message_format:
 *                   type: string
 *                   enum: [html, md, markdown]
 *                 message_raw:
 *                   type: string
 *               required:
 *                 - message
 *             example:
 *               message: Coucou ! Message envoyé avec un webhook =),
 *               message_format:
 *               message_raw:
 *     responses:
 *       200:
 *         description:
 */
webhookRouter.post("/api/webhook/post/:webhook?", postMessage)

webhookRouter.post("/api/webhook/upload/:webhook?", fileUpload({
    abortOnLimit: true,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    debug: true,
    logger: {
        log: (msg) => {
            logger.debug(msg)
        }
    }
}), uploadFile)

export default webhookRouter
