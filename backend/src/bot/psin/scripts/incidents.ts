import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import fetchWithError from "../../../utils/fetchWithError.js";
import {sendHtmlMessage} from "../../common/helper.js";


/**
 * @help
 * command : liste incidents
 * return : je retourne la liste des incidents en cours
 * isAnswer : true
 */
export function listIncidentsIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(list.*incident).*/i


    if (regex.test(body)) {

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            const roomId = event.event.room_id

            const psinApiKey = process.env.PSIN_API_KEY || ""

            fetchWithError("http://psin.supervision.e2.rie.gouv.fr/centreon/ApiPsin.php?cle=" + psinApiKey + "&indic=incident", {proxify: true})
                .then((value: Response) => {
                    value.text().then(decodedGzip => sendHtmlMessage(client, roomId, decodedGzip, decodedGzip))
                })

            return true
        }
    }

    return false
}
