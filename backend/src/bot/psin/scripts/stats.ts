import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import fetchWithError from "../../../utils/fetchWithError.js";
import {sendHtmlMessage, sendMessage} from "../../common/helper.js";
import logger from "../../../utils/logger.js";


/**
 * @help
 * command : stats
 * return : je retourne les statistiques en cours
 * isAnswer : true
 */
export function statsIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(stats).*/i


    if (regex.test(body)) {

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            const roomId = event.event.room_id

            const psinApiKey = process.env.PSIN_API_KEY || ""

            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
            fetchWithError("https://psin.supervision.e2.rie.gouv.fr/centreon/ApiPsin.php?cle=" + psinApiKey + "&indic=stats", {proxify: true})
                .then((value: Response) => {
                    value.text().then(decodedGzip => sendHtmlMessage(client, roomId, decodedGzip, decodedGzip))
                }).catch(reason => {
                sendMessage(client, roomId, "❗ Il semblerait que j'ai un problème pour contacter la supervision !")
                logger.error("Error listing stats :", reason)
            }).finally(() => {
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1'
            })

            return true
        }
    }

    return false
}
