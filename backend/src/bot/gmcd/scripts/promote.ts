import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../../utils/logger.js";
import {getUserPowerLevel, sendMessage} from "../helper.js";

export function promoteUserIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(promote me|promeut moi).*/i


    if (regex.test(body)) {

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            const roomId = event.event.room_id
            const userId = event.sender.userId

            getUserPowerLevel(client, event).then(user => {
                if (user) {

                    if (!user.isAdministrator) {
                        logger.debug("Promoting " + user.username + ".")
                        client.setPowerLevel(roomId, userId, 100);
                        sendMessage(client, roomId, "Je viens de promouvoir " + user.username + ". Félicitation ! 🎆")
                    }
                    else {
                        sendMessage(client, roomId, "Mais... Vous êtes déjà administrateur ! 🤦")
                    }
                }
            })

            return true
        }
    }

    return false
}
