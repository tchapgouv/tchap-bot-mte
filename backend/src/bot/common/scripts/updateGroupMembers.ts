import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import {getPowerLevel, isSupport, sendMessage} from "../helper.js";
import botService from "../../../services/bot.service.js";

/**
 * --help
 * command : update members
 * return : je mets à jour les utilisateurs de ce salon <sup>*</sup>
 * isAnswer : true
 * isAdmin : true
 */
export function updateRoomUsersListIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /(?=.*(?:update|maj))(?=.*list)(?=.*(?:member|membre)).*/i

    if (regex.test(body)) {

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            const roomId = event.event.room_id
            const userId = event.sender.userId

            getPowerLevel(client, roomId, userId).then(powerLevel => {

                if (powerLevel === 100 || isSupport(userId)) {

                    botService.updateRoomMemberList(client, roomId)

                } else {
                    sendMessage(client, roomId, "Désolé, seul un administrateur me demander cela ! 🤷")
                }
            })

            return true
        }
    }
    return false
}
