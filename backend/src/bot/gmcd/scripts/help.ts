import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import {generateHelp, getPowerLevel, sendMarkdownMessage} from "../../common/helper.js";
import {fileURLToPath} from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @help
 * command : help|aide
 * return : j'affiche cette aide !
 * isAnswer : true
 */
export function helpIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(help|aide).*/i

    if (regex.test(body)) {


        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            const roomId = event.event.room_id
            const userId = event.sender.userId

            getPowerLevel(client, roomId, userId).then(powerLevel => {

                return sendMarkdownMessage(client, roomId, generateHelp(__dirname, powerLevel === 100))
            })

            return true
        }
    }

    return false

}
