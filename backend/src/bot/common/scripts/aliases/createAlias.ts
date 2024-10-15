import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import {getUserPowerLevel, sendMessage} from "../../helper.js";
import logger from "../../../../utils/logger.js";


/**
 * @help
 * command : create alias nom-de-l-alias|créer alias nom-de-l-alias
 * return : je crée un alias pour le salon <sup>*</sup>
 * isAnswer : true
 * isAdmin : true
 */
export function createAliasIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(create|créer) alias.*/i

    if (regex.test(body)) {

        let alias = body.replace(/.*?alias +([^ ]*).*/, "$1");
        let botId = client.getUserId() + "";

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id && botId) {

            const roomId = event.event.room_id
            // if (!alias.includes(":")) alias += roomId.replace(/.*(:.*)/, "$1")

            getUserPowerLevel(client, event).then(user => {

                if (user && user.isAdministrator) {

                    client.getLocalAliases(roomId).then(value => {
                        if (value.aliases.indexOf(alias) !== -1) {
                            sendMessage(client, roomId, "Un alias identique existe déjà. 🤷")
                        } else {
                            client.createAlias(alias, roomId).then(_ => {
                                sendMessage(client, roomId, "L'alias '" + alias + "' à été créé. 🎆")
                            }).catch(reason => {
                                sendMessage(client, roomId, "❗Erreur lors de la création de l'alias")
                                logger.error("Error creating alias", alias, reason)
                            })
                        }
                    })

                } else {
                    sendMessage(client, roomId, "Désolé, seul un administrateur peut créer des aliases ! 🤷")
                }
            })

            return true
        }
    }

    return false
}
