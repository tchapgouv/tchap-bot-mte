import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../../utils/logger.js";
import {addEmoji} from "../helper.js";

/**
 * @help
 * return : Je dis au revoir 👋 !
 */
export function bePoliteIfHeard(client: MatrixClient, event: MatrixEvent, body: string) {

    const regexGoodbye: RegExp = /.*(bonne soirée|[aà] demain|bon we|bonsoir|tcho|tchao|ciao|au revoir).*/i

    if (regexGoodbye.test(body) && body.length < 40) {
        logger.debug("Saying goodbye.")
        addEmoji(client, event, "👋");
    }

    const regexHello: RegExp = /^ *(bonjour|hello|salut|holà).*/i
    const emojiHello: string[] = ["☕", "🍵", "🥐", "👋", "🤗"]

    const hour = (new Date()).getHours()

    if (regexHello.test(body) && hour < 10 && body.length < 35) {
        logger.debug("Saying Hi.")
        addEmoji(client, event, emojiHello[Math.floor(Math.random() * emojiHello.length)]);
    }
}
