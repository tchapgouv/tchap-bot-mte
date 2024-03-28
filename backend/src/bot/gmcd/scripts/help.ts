import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import {sendMessage} from "../helper.js";

export function helpIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(help|aide).*/i

    if (regex.test(body)) {

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            const roomId = event.event.room_id
            // const userId = event.sender.userId

            const message = "Voici une liste non exhaustive des commandes auxquelles je sais répondre : " +
                " - oust (Je quitte le canal)" +
                " - promote me|promeut moi (Je promeus administrateur un utilisateur si je suis moi même administrateur)" +
                " - create webhook|créer webhook (Administrateur uniquement ! Je créé un webhook (RIE) pour le canal afin d'y envoyer des messages)" +
                " - Je dis au revoir 😁"
                // " - Je connais Chuck Norris"

            sendMessage(client, roomId, message)

            return true
        }
    }

    return false
}
