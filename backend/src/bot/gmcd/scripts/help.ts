import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import {sendMessage} from "../helper.js";

import fs from 'fs';
import logger from "../../../utils/logger.js";
import {fileURLToPath} from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const files = fs.readdirSync(__dirname);
let commandes: { command: string | undefined, return: string, isAnswer: boolean }[] = []
for (const file of files) {
    if (/.*\.js/i.test(file))
        try {
            const data = fs.readFileSync(__dirname + "/" + file, 'utf8');

            const regexCommand: RegExp = /[\s\S]* \* @help.*(?:\n \* .*)*\n \* command *: *(.*)/i
            const regexReturn: RegExp = /[\s\S]* \* @help.*(?:\n \* .*)*\n \* return *: *(.*)/i
            const regexIsAnswer: RegExp = /[\s\S]* \* @help.*(?:\n \* .*)*\n \* isAnswer *: *(.*)/i

            const matchCommand = data.match(regexCommand)?.at(1)
            const matchReturn = data.match(regexReturn)?.at(1)
            const matchIsAnswer = data.match(regexIsAnswer)?.at(1)

            if (!matchReturn) continue

            const command = {
                command: matchCommand,
                return: matchReturn,
                isAnswer: matchIsAnswer ? matchIsAnswer === 'true' : false
            }

            commandes.push(command)

            commandes.sort((a, b) => {
                if (a.command && !b.command) return 1
                if (!a.command && b.command) return -1
                if (a.isAnswer && !b.isAnswer) return 1
                if (!a.isAnswer && b.isAnswer) return -1
                if (a.command && b.command) return a.command < b.command ? 1 : -1
                return a.return < b.return ? 1 : -1
            }).reverse()
        } catch (err) {
            logger.error(err);
        }
}
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
