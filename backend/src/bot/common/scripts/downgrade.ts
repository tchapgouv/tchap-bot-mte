import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../../utils/logger.js";
import {getPowerLevel, getUserPowerLevel, sendMessage} from "../helper.js";


/**
 * @help
 * command : downgrade yourself|rétrograde toi
 * return : je me rétrograde à modérateur ou utilisateur lambda
 * isAnswer : true
 */
export function downgradeIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(downgrade|rétrograde|déclasse).*/i


    if (regex.test(body)) {

        let botId = client.getUserId() + "";

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id && botId) {

            const roomId = event.event.room_id

            getUserPowerLevel(client, event).then(user => {

                if (user && user.isAdministrator) {

                    logger.warning("Someone downgraded me.")

                    getPowerLevel(client, roomId, botId).then(powerLevel => {

                        client.setPowerLevel(roomId, botId, powerLevel === 100 ? 50 : 0).catch(e => logger.error(e));
                        sendMessage(client, roomId, "C'est fait !")
                    })

                } else {
                    sendMessage(client, roomId, "Désolé, seul un administrateur rétrograder ! 🤷")
                }
            })

            return true
        }
    }

    return false
}
