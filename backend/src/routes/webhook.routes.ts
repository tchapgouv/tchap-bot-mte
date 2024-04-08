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

webhookRouter.post("/api/webhook/post/:webhook?", postMessage)

export default webhookRouter
