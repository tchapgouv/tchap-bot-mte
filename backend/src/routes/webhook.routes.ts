import express from 'express';
import {create, destroy, findAll, findOneWithWebhook, postMessage, update, uploadFile} from "../controllers/webhook.controller.js";
import fileUpload from 'express-fileupload'
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

webhookRouter.use(fileUpload({
    // Configure file uploads with maximum file size 10MB
    limits: {
        fileSize: 10 * 1024 * 1024
    }
}))

webhookRouter.post("/api/webhook/upload/:webhook?", uploadFile)


export default webhookRouter
