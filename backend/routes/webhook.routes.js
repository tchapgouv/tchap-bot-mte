import express from 'express';
import {create, destroy, findAll, findOneWithWebhook} from "../services/webhook.service.js";
import {verifyToken} from "../controllers/auth.controller.js";
import bot from "../utils/bot.js";

const router = express.Router();

// Create a new Tutorial
router.post("/api/create", verifyToken, create);

router.post("/api/webhook/delete", verifyToken, destroy);
// router.post("/create", create);

// Retrieve all webhooks
router.get("/api/getall", verifyToken, findAll);

router.post("/api/post/:webhook", verifyToken, (req, res) => {

  findOneWithWebhook(req, res).then(data => {

    const room_id = data.dataValues.room_id

    bot.sendTextMessage(room_id, req.body.message + " (webhook=" + req.params.webhook + ")").then(() => {
      res.json({message: "Message sent"})
    }).catch(e => console.error(e))

  })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving webhook."
      });
    });
})

export default router
