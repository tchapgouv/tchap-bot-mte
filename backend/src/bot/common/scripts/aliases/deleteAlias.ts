import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import {getUserPowerLevel, sendMessage} from "../../helper.js";
import logger from "../../../../utils/logger.js";


/**
 * @help
 * command : delete alias nom-de-l-alias|supprimer alias nom-de-l-alias
 * return : je supprime un alias pour le salon <sup>*</sup>
 * isAnswer : true
 * isAdmin : true
 */
export function deleteAliasIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(supprimer|delete) alias.*/i

    if (regex.test(body)) {

        let alias = body.replace(/.*alias +([^ ]*?).*/, "$1");
        let botId = client.getUserId() + "";

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id && botId) {

            const roomId = event.event.room_id
            if (!alias.includes(":")) alias += roomId.replace(/.*(:.*)/, "$1")

            getUserPowerLevel(client, event).then(user => {

                if (user && user.isAdministrator) {

                    client.getLocalAliases(roomId).then(value => {
                        if (value.aliases.indexOf(alias) === -1) {
                            sendMessage(client, roomId, "Aucun alias '" + alias + "' n'existe. 🤷")
                        } else {
                            client.deleteAlias(alias).then(_ => {
                                sendMessage(client, roomId, "l'alias a été supprimé. 🎆")
                            }).catch(reason => {
                                sendMessage(client, roomId, "❗Erreur lors de la suppression de l'alias.")
                                logger.error("Error deleting alias", alias, reason)
                            })
                        }
                    })

                } else {
                    sendMessage(client, roomId, "Désolé, seul un administrateur peut supprimer des aliases ! 🤷")
                }
            })

            return true
        }
    }

    return false
}
