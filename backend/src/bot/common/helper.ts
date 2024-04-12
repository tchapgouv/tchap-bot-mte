import {EventType, MatrixClient, MatrixEvent, MsgType, RelationType} from "matrix-js-sdk";
import logger from "../../utils/logger.js";
import {User} from "../classes/User.js";
import fs from "fs";


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

export async function sendMessage(client: MatrixClient, room: string, message: string): Promise<void> {

    logger.debug("Sending message : ", message)
    logger.debug("room : ", room)

    const content = {
        "body": message,
        "msgtype": MsgType.Text
    };
    await client.sendEvent(room, EventType.RoomMessage, content).then((res) => {
        logger.debug(res);
    }).catch(reason => {
        logger.error(reason)
    });
}


export function extractHelpFromComments(commandes: { command: string | undefined, return: string, isAnswer: boolean }[], file: string) {
    if (/.*\.js/i.test(file)) {
        try {
            const data = fs.readFileSync(__dirname + "/" + file, 'utf8');

            const regexCommand: RegExp = /[\s\S]* \* @help.*(?:\n \* .*)*\n \* command *: *(.*)/i
            const regexReturn: RegExp = /[\s\S]* \* @help.*(?:\n \* .*)*\n \* return *: *(.*)/i
            const regexIsAnswer: RegExp = /[\s\S]* \* @help.*(?:\n \* .*)*\n \* isAnswer *: *(.*)/i

            const matchCommand = data.match(regexCommand)?.at(1)
            const matchReturn = data.match(regexReturn)?.at(1)
            const matchIsAnswer = data.match(regexIsAnswer)?.at(1)

            if (!matchReturn) return commandes;

            const command = {
                command: matchCommand,
                return: matchReturn,
                isAnswer: matchIsAnswer ? matchIsAnswer === 'true' : false
            }

            commandes.push(command)
        } catch (err) {
            logger.error(err);
        }
    }
    return commandes
}

export async function sendHtmlMessage(client: MatrixClient, room: string, rawMessage: string, htmlMessage: string): Promise<void> {

    logger.debug("Sending message : ", rawMessage)
    logger.debug("room : ", room)

    const content = {
        "body": rawMessage,
        "formatted_body": htmlMessage,
        "format": "org.matrix.custom.html",
        "msgtype": MsgType.Text
    };
    await client.sendEvent(room, EventType.RoomMessage, content).then((res) => {
        logger.debug(res);
    }).catch(reason => {
        logger.error(reason)
    });
}

export async function getUserPowerLevel(client: MatrixClient, event: MatrixEvent): Promise<User | null> {

    let user: User | undefined

    if (event?.sender?.name &&
        event?.sender?.userId &&
        event?.event?.room_id) {

        const roomId = event.event.room_id
        const userName = event.sender.name
        const userId = event.sender.userId

        await client.getStateEvent(roomId, "m.room.power_levels", "").then(record => {

            logger.debug(record)

            const userPowerLevel = record.users[userId]

            user = {
                id: userId,
                powerLevel: userPowerLevel,
                username: userName,
                isAdministrator: userPowerLevel > 99,
                isModerator: userPowerLevel > 49
            }
        })
    }

    if (!user) return null
    return user
}

export async function isSomeoneAdmin(client: MatrixClient, roomId: string): Promise<boolean> {

    let someoneIsAdmin: boolean = false

    await client.getStateEvent(roomId, "m.room.power_levels", "").then(record => {

        logger.debug(record)

        for (const user in record.users) {
            if (/.*bot-gmcd.*/i.test(user)) continue
            const powerLevel = record.users[user]
            if (powerLevel > 99) someoneIsAdmin = true
        }
    })

    logger.debug("someoneIsAdmin = " + someoneIsAdmin)

    return someoneIsAdmin
}
