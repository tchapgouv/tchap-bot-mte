import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import {getPowerLevel, sendMessage} from "../helper.js";
import ldapGroupService from "../../../services/ldapGroup.service.js";

/**
 * --help
 * command : delete ldap group
 * return : Je supprime la requête ldap gérant les membres de ce salon <sup>*</sup>
 * isAnswer : true
 */
export function deleteRoomUsersListIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*delete ldap group.*/i

    if (regex.test(body)) {

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            const roomId = event.event.room_id
            const userId = event.sender.userId

            getPowerLevel(client, roomId, userId).then(powerLevel => {

                if (powerLevel === 100) {

                    ldapGroupService.destroy(roomId).then(_value => {
                        sendMessage(client, roomId, "Groupe supprimé.")
                    })

                } else {
                    sendMessage(client, roomId, "Désolé, seul un administrateur me demander cela ! 🤷")
                }
            })

            return true
        }
    }
    return false
}
