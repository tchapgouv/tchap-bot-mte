import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import {extractHelpFromComments, sendMessage} from "../../common/helper.js";

import fs from 'fs';
import logger from "../../../utils/logger.js";
import {fileURLToPath} from "url";
import path from "path";

let commandes: { command: string | undefined, return: string, isAnswer: boolean }[] = []

const __filename = fileURLToPath(import.meta.url);
let __dirname = path.dirname(__filename);
let files = fs.readdirSync(__dirname);

for (const file of files) {
    commandes = extractHelpFromComments(commandes, __dirname, file);
}

__dirname = path.resolve(__filename, "../../../common/scripts");
files = fs.readdirSync(__dirname);

for (const file of files) {
    commandes = extractHelpFromComments(commandes, __dirname, file);
}

commandes.sort((a, b) => {
    if (a.command && !b.command) return 1
    if (!a.command && b.command) return -1
    if (a.isAnswer && !b.isAnswer) return 1
    if (!a.isAnswer && b.isAnswer) return -1
    if (a.command && b.command) return a.command < b.command ? 1 : -1
    return a.return < b.return ? 1 : -1
}).reverse()
// logger.notice(commandes);

let help = "Voici une liste non exhaustive des commandes auxquelles je sais répondre :\n"
for (const commande of commandes) {
    help += " - "
    if (commande.command) {
        help += commande.isAnswer ? "Si on me dit " : "Si j'entends "
        help += "'" + commande.command + "', "
    }
    help += commande.return + "\n"
}
logger.notice(help)

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

            sendMessage(client, roomId, help)

            return true
        }
    }

    return false
}
