import express from 'express';
import {destroy, findAll, findOneWithWebhook, postMessage, update} from "../services/webhook.service.js";
import {create} from "../controllers/webhook.controller.js";
import {verifyToken} from "../controllers/auth.controller.js";

const webhookRouter = express.Router();

// Create a new Tutorial
webhookRouter.post("/api/webhook/create", verifyToken, create);

webhookRouter.delete("/api/webhook/delete", verifyToken, destroy);
// router.post("/create", create);

// Retrieve all webhooks
webhookRouter.get("/api/webhook/list", verifyToken, findAll);

webhookRouter.post("/api/webhook/get", verifyToken, findOneWithWebhook);

webhookRouter.put("/api/webhook/update", verifyToken, update);

webhookRouter.post("/api/webhook/post/:webhook?", postMessage)

export default webhookRouter
