import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../../utils/logger.js";
import {addEmoji} from "../helper.js";

/**
 * @help
 * return : Je dis au revoir 👋 !
 */
export function sayGoodbyeIfNecessary(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(bonne soirée|[aà] demain|bon we|bonsoir|tcho|tchao|ciao).*/i

    if (regex.test(body)) {
        logger.debug("Saying goodbye.")
        addEmoji(client, event, "👋");
    }
}
