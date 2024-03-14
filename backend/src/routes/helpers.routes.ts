import express from 'express';
import {verifyTimeToken} from "../controllers/auth.controller.js";
import {createRoomAndInvite} from "../services/bot.service.js";
import logger from "../utils/logger.js";

const helpersRouter = express.Router();

helpersRouter.post("/api/migrate/room", verifyTimeToken, (req, res) => {

    if (!req.body.room_name) res.status(500).json({message: 'Missing room name !'});
    if (!req.body.users_list) res.status(500).json({message: 'Missing users UIDs list !'});

    createRoomAndInvite(req.body.room_name, req.body.users_list, req.body.room_id).then(value => {
        res.status(value.status).json(value)
    }).catch(reason => {
        logger.error("Error migrating room (" + req.body.room_name + ")", reason)
        res.status(500).json(reason)
    })
})

export default helpersRouter
