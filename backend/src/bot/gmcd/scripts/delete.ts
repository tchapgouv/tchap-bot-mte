import {MatrixClient} from "matrix-js-sdk";
import logger from "../../../utils/logger.js";
import {getPowerLevel, sendMessage} from "../../common/helper.js";
import botService from "../../../services/bot.service.js";

/**
 * @help
 * command : oust
 * return : je quitte le canal
 * isAnswer : true
 */
export function deleteRoomIfAsked(client: MatrixClient, roomId: string, userId: string, body: string) {

    const leaveRoomOptions = ["delete room " + roomId]

    if (roomId && body && leaveRoomOptions.some(option => body.includes(option))) {

        getPowerLevel(client, roomId, userId).then(powerLevel => {

            if (powerLevel === 100) {

                logger.warning(userId + " deleted room : " + roomId)
                sendMessage(client, roomId, "This is 'The End of the ******* World' ! 😭")
                botService.deleteRoom(roomId).catch(reason => sendMessage(client, roomId, reason))

            } else {
                sendMessage(client, roomId, "Désolé, seul un administrateur me demander cela ! 🤷")
            }
        })

        return true
    }
    return false
}
