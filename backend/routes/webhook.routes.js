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
// router.post("/create", create);

router.post("/api/webhook/:webhook/post", verifyToken, (req, res) => {

  findOne({where: {webhook_id: req.params.webhook}}).then(data => {

    const room_id = data.dataValues.room_id
    const script = data.dataValues.script

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
