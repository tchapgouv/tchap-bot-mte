import {Request, Response} from "express";
import botService from "../services/bot.service.js";
import logger from "../utils/logger.js";
import {StatusCodes} from "http-status-codes";

export function migrateRoom(req: Request, res: Response) {

    if (!req.body.room_name) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing room name !'});
    if (!req.body.users_list) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing users UIDs list !'});

    botService.createRoom(req.body.room_name).then(value => {

        botService.inviteUsersInRoom(req.body.users_list, value.roomId).then(_value => {

            res.status(StatusCodes.OK).json({message: "Room created and users invited"})

        }).catch(reason => {
            logger.error("Error inviting users (" + req.body.room_name + ")", reason)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(reason)
        })

    }).catch(reason => {
        logger.error("Error creating room (" + req.body.room_name + ")", reason)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(reason)
    })
}

export function createRoom(req: Request, res: Response) {

    if (!req.body.room_name) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing room name !'});

    botService.createRoom(req.body.room_name).then(_value => {

        res.status(StatusCodes.OK).json({message: "Room created"})

    }).catch(reason => {
        logger.error("Error creating room (" + req.body.room_name + ")", reason)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(reason)
    })
}

export function inviteUsers(req: Request, res: Response) {

    if (!req.body.users_list) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing users UIDs list !'});
    if (!req.body.room_id) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing room id !'});

    botService.inviteUsersInRoom(req.body.users_list, req.body.room_id).then(_value => {

        res.status(StatusCodes.OK).json({message: "Users invited"})

    }).catch(reason => {
        logger.error("Error inviting users (" + req.body.room_name + ")", reason)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(reason)
    })
}

export function getRoomName(req: Request, res: Response) {

    if (!req.body.room_id) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing room id !'});

    botService.getRoomName(req.body.room_id).then(value => {

        res.status(StatusCodes.OK).json({message: value, name: value})

    }).catch(reason => {
        logger.error("Error getting room name (" + req.body.room_id + ")", reason)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(reason)
    })
}

export function isMemberOfRoom(req: Request, res: Response) {

    if (!req.body.room_id) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing room id !'});

    botService.isMemberOfRoom(req.body.room_id, req.body.user_id).then(isMember => {

        let message = (req.body.user_id ? req.body.user_id : "Bot-Gmcd") + " is " + (isMember ? "" : "not ") + "a member of " + req.body.room_id

        res.status(StatusCodes.OK).json({message: message, isMember: isMember})

    }).catch(reason => {
        logger.error("Error getting room name (" + req.body.room_id + ")", reason)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(reason)
    })
}
