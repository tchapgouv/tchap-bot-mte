import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import {answerHelp, generateHelp} from "../../common/helper.js";
import {fileURLToPath} from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const help = generateHelp(__dirname)

/**
 * @help
 * command : help|aide
 * return : j'affiche cette aide !
 * isAnswer : true
 */
export function helpIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    return answerHelp(body, event, client, help);
}
