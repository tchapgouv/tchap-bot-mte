import {Request, Response} from "express";
import botService from "../services/bot.service.js";
import logger from "../utils/logger.js";
import {StatusCodes} from "http-status-codes";

export async function migrateRoom(req: Request, res: Response) {

    if (!req.body.room_name && !req.body.room_id) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing room name or room id !'});
    if (!req.body.users_list) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing users UIDs list !'});

    if (req.body.room_id) {

        await botService.inviteUsersInRoom(req.body.users_list, req.body.room_id).then(_value => {

            logger.info("Users invited in ", req.body.room_id)
            res.status(StatusCodes.OK).json({message: "Users invited"})

        }).catch(reason => {
            logger.error("Error inviting users (" + req.body.room_name + ")", reason)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(reason)
        })

    } else {

        let roomId: string | undefined
        await botService.createRoom(req.body.room_name, req.body.is_private).then(value => {
            roomId = value.roomId
        }).catch(reason => {
            logger.error("Error creating room (" + req.body.room_name + ")", reason)
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(reason)
        })

        if (roomId) {
            await botService.inviteUsersInRoom(req.body.users_list, roomId).then(_value => {

                logger.info("Room " + req.body.room_name + " created and users invited")
                res.status(StatusCodes.OK).json({message: "Room created and users invited", room_id: roomId})

            }).catch(reason => {
                logger.error("Error inviting users (" + req.body.room_name + ")", reason)
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(reason)
            })
        }
    }
}

export async function createRoom(req: Request, res: Response) {

    if (!req.body.room_name) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing room name !'});

    await botService.createRoom(req.body.room_name).then(data => {

        res.status(StatusCodes.OK).json({message: "Room created", room_id: data.roomId})

    }).catch(reason => {
        logger.error("Error creating room (" + req.body.room_name + ")", reason)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(reason)
    })
}

export async function deleteRoom(req: Request, res: Response) {

    if (!req.body.room_id) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing room id !'});

    await botService.deleteRoom(req.body.room_id, {kickReason: req.body.kick_reason}).then(_value => {

        res.status(StatusCodes.OK).json({message: "Room deleted"})

    }).catch(reason => {
        logger.error("Error deleting room (" + req.body.room_id + ")", reason)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(reason)
    })
}

export async function kickUser(req: Request, res: Response) {

    if (!req.body.room_id) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing room id !'});
    if (!req.body.user_id) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing user id !'});

    await botService.kickUser(req.body.room_id, req.body.user_id, req.body.kick_reason).then(message => {

        res.status(StatusCodes.OK).json(message)

    }).catch(reason => {
        logger.error("Error kicking user", reason)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(reason)
    })
}

export async function inviteUsers(req: Request, res: Response) {

    if (!req.body.users_list) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing users UIDs list !'});
    if (!req.body.room_id) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing room id !'});

    await botService.inviteUsersInRoom(req.body.users_list, req.body.room_id).then(_value => {

        res.status(StatusCodes.OK).json({message: "Users invited"})

    }).catch(reason => {
        logger.error("Error inviting users (" + req.body.room_name + ")", reason)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(reason)
    })
}

export async function getRoomName(req: Request, res: Response) {

    if (!req.body.room_id) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing room id !'});

    await botService.getRoomName(req.body.room_id).then(value => {

        res.status(StatusCodes.OK).json({message: value, room_name: value})

    }).catch(reason => {
        logger.error("Error getting room name (" + req.body.room_id + ")", reason)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(reason)
    })
}

export async function isMemberOfRoom(req: Request, res: Response) {

    if (!req.body.room_id) res.status(StatusCodes.BAD_REQUEST).json({message: 'Missing room id !'});

    await botService.isMemberOfRoom(req.body.room_id, req.body.user_id).then(isMember => {

        let message = (req.body.user_id ? req.body.user_id : "Bot-Gmcd") + " is " + (isMember ? "" : "not ") + "a member of " + req.body.room_id

        res.status(StatusCodes.OK).json({message: message, isMember: isMember})

    }).catch(reason => {
        logger.error("Error getting room name (" + req.body.room_id + ")", reason)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(reason)
    })
}
