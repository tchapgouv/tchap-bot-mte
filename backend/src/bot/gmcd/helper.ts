import {EventType, MatrixClient, MatrixEvent, MsgType, RelationType} from "matrix-js-sdk";
import logger from "../../utils/logger.js";


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

export function sendMessage(client: MatrixClient, room: string, message: string) {
    logger.debug("Sending message : ", message)

    const content = {
        "body": message, "msgtype": MsgType.Text,
    };
    client.sendEvent(room, EventType.RoomMessage, content).then((res) => {
        logger.debug(res);
    }).catch(e => logger.error(e));
}

export function inviteByMail(client: MatrixClient, room: string, email: string) {
    logger.debug("Inviting message : ", email)

    const message = "/invite " + email

    const content = {
        "body": message, "msgtype": MsgType.Text,
    };
    client.sendEvent(room, EventType.RoomMessage, content).then((res) => {
        logger.debug(res);
    }).catch(e => logger.error(e));
}
