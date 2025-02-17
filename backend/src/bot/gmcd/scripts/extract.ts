import {MatrixClient} from "matrix-js-sdk";
import botService from "../../../services/bot.service.js";
import {sendMessage} from "../../common/helper.js";


/**
 * --help
 * command : extract
 * return : Je génère une extraction des messages sur une semaine
 */
export function extractHistoryIfAsked(client: MatrixClient, roomId: string, body: string) {

    const regex: RegExp = /.*(get history( |$)).*/i

    if (regex.test(body)) {

        sendMessage(client, roomId, "Recherche des messages des 7 derniers jours.\n🕰️ Merci de patienter.")

        botService.getHistorySinceMilliseconds(roomId, {since: 1000 * 60 * 60 * 24 * 7}).then(value => {
            const discussion = value.map(chunkElement => {
                return {
                    body: chunkElement.content.body,
                    sender: chunkElement.sender,
                    timestamp: chunkElement.origin_server_ts
                }
            })
            const bufferedDiscussion = Buffer.from(JSON.stringify(discussion));

            const numberOfMessages = value.length
            sendMessage(client, roomId, numberOfMessages + " messages trouvés.")
            client.uploadContent(bufferedDiscussion, {name: new Date().toLocaleDateString("fr-FR") + "_j-7.json", type: 'application/json', includeFilename: true})
        })
        return true
    }
    return false
}
