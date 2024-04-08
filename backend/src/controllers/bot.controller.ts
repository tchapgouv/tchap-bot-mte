import {Request, Response} from "express";
import botService from "../services/bot.service.js";
import logger from "../utils/logger.js";
import {StatusCodes} from "http-status-codes";

export function migrateRoom(req: Request, res: Response) {

    if (!req.body.room_name) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing room name !'});
    if (!req.body.users_list) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing users UIDs list !'});

    botService.createRoomAndInvite(req.body.room_name, req.body.users_list, req.body.room_id).then(value => {

        res.status(StatusCodes.OK).json({message: "Room created"})

    }).catch(reason => {
        logger.error("Error migrating room (" + req.body.room_name + ")", reason)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(reason)
    })
}
