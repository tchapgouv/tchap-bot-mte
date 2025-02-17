import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import {getPowerLevel, isSupport, sendMessage} from "../../helper.js";
import ldapGroupService from "../../../../services/ldapListGroup.service.js";

/**
 * --help
 * command : delete ldap group
 * return : Je supprime la requête ldap gérant les membres de ce salon <sup>*</sup>
 * isAnswer : true
 * isAdmin : true
 */
export function deleteLdapUsersListIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(delete|supprimer) (ldap ?|groupe? ?){2}.*/i

    if (regex.test(body)) {

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            const roomId = event.event.room_id
            const userId = event.sender.userId

            getPowerLevel(client, roomId, userId).then(powerLevel => {

                if (powerLevel === 100 || isSupport(userId)) {

                    ldapGroupService.destroy(roomId).then(numberOfDeletedRows => {
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
