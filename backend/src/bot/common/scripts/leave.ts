import {MatrixClient} from "matrix-js-sdk";
import logger from "../../../utils/logger.js";
import {getPowerLevel, isSupport, sendMessage} from "../helper.js";
import botService from "../../../services/bot.service.js";

/**
 * @help
 * command : oust
 * return : je quitte le canal <sup>*</sup>
 * isAnswer : true
 * isAdmin : true
 */
export function leaveRoomIfAsked(client: MatrixClient, roomId: string, userId: string, body: string) {

    const leaveRoomOptions = ["oust"]

    if (roomId && body && leaveRoomOptions.some(option => body.includes(option))) {

        getPowerLevel(client, roomId, userId).then(powerLevel => {

            if (powerLevel === 100 || isSupport(userId)) {

                botService.isMemberOfRoom(roomId, client.getUserId() || "").then(isBotMemberOfRoom => {
                    if (!isBotMemberOfRoom) logger.warning("Someone is trying to make " + client.getUserId() + " leave " + roomId + " which he is not a member of !")
                    else {
                        logger.warning("Someone dismissed me :(")
                        sendMessage(client, roomId, "Au revoir ! 😭")
                        client.leave(roomId).catch(e => logger.error(e))
                    }
                })

            } else {
                sendMessage(client, roomId, "Désolé, seul un administrateur peut me renvoyer ! 🤷")
            }
        })

        return true
    }
    return false
}
