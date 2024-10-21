import {MatrixClient} from "matrix-js-sdk";
import logger from "../../../utils/logger.js";
import {getPowerLevel, isSupport, sendMessage} from "../helper.js";
import botService from "../../../services/bot.service.js";

/**
 * @help
 * command : delete room !roomId
 * return : je supprime le canal <sup>*</sup>
 * isAnswer : true
 * isAdmin : true
 */
export function deleteRoomIfAsked(client: MatrixClient, roomId: string, userId: string, body: string) {

    const leaveRoomOptions = ["delete room " + roomId.toLowerCase()]

    if (roomId && body && leaveRoomOptions.some(option => body.includes(option))) {

        getPowerLevel(client, roomId, userId).then(powerLevel => {

            if (powerLevel === 100 || isSupport(userId)) {

                logger.warning(userId + " deleted room : " + roomId)
                sendMessage(client, roomId, "This is 'The End of the ******* World' ! 😭")
                botService.deleteRoom(roomId, {client: client}).catch(reason => sendMessage(client, roomId, reason)).catch(reason => {
                    logger.error("Error deleting room (" + roomId + ")", reason)
                    sendMessage(client, roomId, "Désolé, une erreur est survenue ! 🤷")
                })

            } else {
                sendMessage(client, roomId, "Désolé, seul un administrateur me demander cela ! 🤷")
            }
        })

        return true
    }
    return false
}
