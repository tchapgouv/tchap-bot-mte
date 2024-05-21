import express from 'express';
import {destroy, findAll, findOneWithWebhook, postMessage, update} from "../controllers/webhook.controller.js";
import {create} from "../controllers/webhook.controller.js";
import {verifyToken} from "../controllers/auth.controller.js";

const webhookRouter = express.Router();

webhookRouter.post("/api/webhook/create", verifyToken, create);

webhookRouter.delete("/api/webhook/delete", verifyToken, destroy);

webhookRouter.get("/api/webhook/list", verifyToken, findAll);

webhookRouter.post("/api/webhook/get", verifyToken, findOneWithWebhook);

webhookRouter.put("/api/webhook/update", verifyToken, update);

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

export default webhookRouter
