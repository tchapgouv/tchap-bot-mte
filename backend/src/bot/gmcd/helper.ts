import {EventType, MatrixClient, MatrixEvent, MsgType, RelationType} from "matrix-js-sdk";
import logger from "../../utils/logger.js";
import {User} from "../classes/user.js";


export function addEmoji(client: MatrixClient, event: MatrixEvent, emoji: string) {
    logger.debug("Sending emoji : ", emoji)

    const room = event.getRoomId()
    if (!room) {
        logger.error("Room id not found while sending emoji !")
        return
    }

    const content = {
        "m.relates_to": {
            "event_id": event.getId(), "key": emoji, "rel_type": RelationType.Annotation
        },
    };

    client.sendEvent(room, EventType.Reaction, content).then((res) => {
        logger.debug(res);
    }).catch(e => logger.error(e));
}

export function sendMessage(client: MatrixClient, room: string, message: string, opts: { avatar_url?: string, displayName?: string } = {}) {

    logger.debug("Sending message : ", message)
    logger.debug("room : ", room)

    return new Promise((resolve, reject) => {
        const content = {
            "body": message,
            "msgtype": MsgType.Text,
            "avatar_url": opts.avatar_url? opts.avatar_url : undefined,
            "displayname": opts.displayName? opts.displayName : undefined
        };
        client.sendEvent(room, EventType.RoomMessage, content).then((res) => {
            resolve(res)
            logger.debug(res);
        }).catch(reason => {
            logger.error(reason)
            reject(reason)
        });
    })
}

export function sendHtmlMessage(client: MatrixClient, room: string, rawMessage: string, htmlMessage: string) {

    logger.debug("Sending message : ", rawMessage)
    logger.debug("room : ", room)

    return new Promise((resolve, reject) => {
        const content = {
            "body": rawMessage,
            "formatted_body": htmlMessage,
            "format": "org.matrix.custom.html",
            "msgtype": MsgType.Text
        };
        client.sendEvent(room, EventType.RoomMessage, content).then((res) => {
            resolve(res)
            logger.debug(res);
        }).catch(reason => {
            logger.error(reason)
            reject(reason)
        });
    })
}

export function getUserPowerLevel(client: MatrixClient, event: MatrixEvent): Promise<User | null> {

    return new Promise((resolve) => {

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            const roomId = event.event.room_id
            const userName = event.sender.name
            const userId = event.sender.userId

            client.getStateEvent(roomId, "m.room.power_levels", "").then(record => {

                logger.debug(record)

                const userPowerLevel = record.users[userId]

                const user: User = {
                    id: userId,
                    powerLevel: userPowerLevel,
                    username: userName,
                    isAdministrator: userPowerLevel > 99,
                    isModerator: userPowerLevel > 49
                }
                resolve(user)
            })
        }
        resolve(null)
    })
}
