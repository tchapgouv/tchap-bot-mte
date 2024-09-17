import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import fetchWithError from "../../../utils/fetchWithError.js";
import {sendHtmlMessage, sendMarkdownMessage} from "../../common/helper.js";
import logger from "../../../utils/logger.js";


/***
 * @help
 * command : statut [ressource]
 * return : je retourne l’état d’une ressource<br/> - Exemple statut AMEDEE pour une application <br/> - Exemple statut ECOL-38080-016-C1 pour un routeur <br/> - Exemple statut MS-AUTH-04 pour un serveur <br/> - Pour la messagerie : statut MESSAGERIE ou statut BNUM <br/> - Pour les applications globales (hebergement) : statut applications ou statut hebergement <br/> - Pour le VPN : statut VPN <br/> - Pour la PFAI : statut PFAI <br/> - Pour le réseau RIE : statut RIE ou RESEAU <br/> - Pour les serveurs MSAD : statut MSAD <br/> - Pour les serveurs FORTIGATE : statut FG <br/> - Seuls les 20 premiers services sont affichés
 * isAnswer : true
 */
export function statutIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(statu[ts].).*/i


    if (regex.test(body)) {

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            const roomId = event.event.room_id

            const regexRessource: RegExp = /.*statu[ts].([^ $]+)(?: |$)/i
            const matchRessource = body.match(regexRessource)?.at(1)

            if (!matchRessource) {
                sendMarkdownMessage(client, roomId, "Il semblerait que vous ne m'ayez pas donné de nom de ressource.\nE.g. `@bot-psin statut messagerie`")
                return true
            }

            const psinApiKey = process.env.PSIN_API_KEY || ""

            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
            fetchWithError("https://psin.supervision.e2.rie.gouv.fr/centreon/ApiPsin.php?cle=" + psinApiKey + "&indic=statut?" + matchRessource, {proxify: true})
                .then((value: Response) => {
                    value.text().then(decodedGzip => sendHtmlMessage(client, roomId, decodedGzip, decodedGzip))
                }).catch(reason => {
                sendMarkdownMessage(client, roomId, "❗ Il semblerait que j'ai un problème pour contacter la supervision et lui demander le statut de `" + matchRessource + "` !")
                logger.error("Error listing contacts :", reason)
            }).finally(() => {
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1'
            })

            return true
        }
    }

    return false
}
