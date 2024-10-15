import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import {getPowerLevel, sendMessage} from "../../helper.js";
import mailGroupService from "../../../../services/mailListGroup.service.js";

/**
 * --help
 * command : delete list group
 * return : Je supprime la configuration gérant les membres de ce salon <sup>*</sup>
 * isAnswer : true
 * isAdmin : true
 */
export function deleteMailUsersListIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /(?=.*(?:delete|supprimer))(?=.*list)(?=.*group).*/i

    if (regex.test(body)) {

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            const roomId = event.event.room_id
            const userId = event.sender.userId

            getPowerLevel(client, roomId, userId).then(powerLevel => {

                if (powerLevel === 100) {

                    mailGroupService.destroy(roomId).then(numberOfDeletedRows => {
                        if (numberOfDeletedRows > 0) {
                            sendMessage(client, roomId, "Configuration du groupe supprimée.")
                        }
                        else {
                            sendMessage(client, roomId, "Aucune configuration du groupe n'est définie pour ce salon.")
                        }
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
