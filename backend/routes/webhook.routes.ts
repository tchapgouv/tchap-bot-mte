import express from 'express';
import {create, destroy, findAll, findOne, findOneWithWebhook, update} from "../services/webhook.service.js";
import {postMessage} from "../services/bot.service.js";
import {verifyToken} from "../controllers/auth.controller.js";

const router = express.Router();

// Create a new Tutorial
router.post("/api/webhook/create", verifyToken, create);

router.delete("/api/webhook/delete", verifyToken, destroy);
// router.post("/create", create);

// Retrieve all webhooks
router.get("/api/webhook/list", verifyToken, findAll);

router.post("/api/webhook/get", verifyToken, findOneWithWebhook);

router.put("/api/webhook/update", verifyToken, update);

router.post("/api/webhook/post/:webhook?", (req, res) => {

    const webhook = req.params.webhook || req.body.webhook

    findOne({where: {webhook_id: webhook}}).then((data) => {

        if (!data) throw "Some error occurred while retrieving webhook"

        const room_id = data.room_id
        const script = data.script

        postMessage(room_id,
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

export default router
