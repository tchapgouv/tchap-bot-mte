import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../../utils/logger.js";
import {sendMessage} from "../helper.js";

export function promoteUserIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(promote me).*/i

    if (event?.sender?.name &&
        event?.sender?.userId &&
        event?.event?.room_id) {

        const roomId = event.event.room_id
        const userId = event.sender.userId

        if (regex.test(body)) {
            logger.debug("Promoting " + event.sender.name + ".")
            sendMessage(client, roomId, "Je viens de promouvoir " + event.sender.name + ". Félicitation ! 🎆")
            client.setPowerLevel(roomId, userId, 100);
        }
        return true
    }

    return false
}
