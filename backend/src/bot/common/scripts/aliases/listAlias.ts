import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import {sendMessage} from "../../helper.js";


/**
 * @help
 * command : list alias|lister alias
 * return : je liste les aliases pour le salon
 * isAnswer : true
 */
export function listAliasIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(list|lister) alias.*/i

    if (regex.test(body)) {

        let botId = client.getUserId() + "";

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id && botId) {

            const roomId = event.event.room_id

            client.getLocalAliases(roomId).then(value => {
                if (value.aliases.length == 0) {
                    sendMessage(client, roomId, "Aucun alias n'existe. 🤷")
                } else {
                    let aliases = "Liste des aliases pour le salon : \n"
                    for (const aliasName of value.aliases) {
                        aliases += " - " + aliasName + "\n"
                    }
                    sendMessage(client, roomId, aliases)
                }
            })

            return true
        }
    }

    return false
}
