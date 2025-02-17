import {MatrixClient} from "matrix-js-sdk";
import botService from "../../../services/bot.service.js";
import {sendMessage} from "../../common/helper.js";


/**
 * --help
 * command : extract
 * return : Je génère une extraction des messages sur une semaine
 */
export function extractIfAsked(client: MatrixClient, roomId: string, body: string) {

    const regex: RegExp = /.*(get history( |$)).*/i

    if (regex.test(body)) {

        botService.getHistorySinceMilliseconds(roomId, {since: 1000 * 60 * 60 * 24 * 7}).then(value => {
            const numberOfMessages = value.length
            sendMessage(client, roomId, "Trouvé " + numberOfMessages + " messages")
        })
    }
}
