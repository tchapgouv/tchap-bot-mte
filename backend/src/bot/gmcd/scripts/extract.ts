import {MatrixClient} from "matrix-js-sdk";
import botService from "../../../services/bot.service.js";
import {sendMessage} from "../../common/helper.js";
import logger from "../../../utils/logger.js";


/**
 * --help
 * command : extract
 * return : Je génère une extraction des messages sur une semaine
 */
export function extractHistoryIfAsked(client: MatrixClient, roomId: string, body: string) {

    const regex: RegExp = /.*(get history( |$)).*/i

    if (regex.test(body)) {

        sendMessage(client, roomId, "Recherche des messages des 7 derniers jours.\nMerci de patienter 🕰️.")

        botService.getHistorySinceMilliseconds(roomId, {since: 1000 * 60 * 60 * 24 * 7}).then(chunkElementList => {


            chunkElementList.slice(0, 5).forEach(chunkElement => {

                logger.debug("chunkElement", chunkElement)

            })

            const discussion = chunkElementList.map(chunkElement => {
                return {
                    body: chunkElement.content.body,
                    sender: chunkElement.sender,
                    timestamp: chunkElement.origin_server_ts
                }
            })
            const stringifyDiscussion = JSON.stringify(discussion, null, 2);

            discussion.map(discussionElement => {
                logger.debug("discussionElement", discussionElement)
            })

            const numberOfMessages = chunkElementList.length
            sendMessage(client, roomId, numberOfMessages + " messages trouvés.\nEnvoi du fichier en cours 📦.")
            botService.upload(roomId, stringifyDiscussion, {
                client,
                fileName: roomId.replace(/:.*?($| )/g, "$1") + "_" + new Date().toLocaleDateString("fr-FR") + "_j-7.json",
                mimeType: 'application/json',
                includeFilename: true
            })
        })
        return true
    }
    return false
}
