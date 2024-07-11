import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import {getPowerLevel, sendMessage} from "../helper.js";
import ldapGroupService from "../../../services/ldapGroup.service.js";

/**
 * @help
 * command : ldap group base_dn:BASE_DN filter:FILTER recursive:true
 * return : je gère les utilisateurs de ce salon en me basant sur une requête ldap <sup>*</sup>
 * isAnswer : true
 */
export function deleteRoomUsersListIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*ldap group.*/i

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
