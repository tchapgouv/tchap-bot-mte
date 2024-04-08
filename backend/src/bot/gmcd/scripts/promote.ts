import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../../utils/logger.js";
import {getUserPowerLevel, sendMessage} from "../helper.js";


/**
 * @help
 * command : promote me|promeut moi
 * return : je promeus administrateur un utilisateur (si je suis moi-même administrateur)
 * isAnswer : true
 */
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
