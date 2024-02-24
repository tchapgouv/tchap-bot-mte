import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../utils/logger.js";
import {addEmoji, sendMessage} from "./helper.js";
import {GMCD_INFRA_ROOM_ID} from "./config.js";


export function sayGoodbyIfNecessary(client: MatrixClient, event: MatrixEvent) {
    const message = event.event.content?.body.toLowerCase()
    if (/.*(bonne soirée|[aà] demain|bon we|bonsoir).*/i.test(message)) {
        logger.debug("Saying goodbye.")
        addEmoji(client, event, "👋");
    }
}

export function parseMessageToSelf(client: MatrixClient, event: MatrixEvent) {

    logger.debug("Parsing Message To Self")

    logger.debug("body =", event.event.content?.body.toLowerCase())
    logger.debug("room_id =", event.event.room_id)

    if (event.event.room_id && event.event.content?.body && ["oust"].indexOf(event.event.content.body.toLowerCase()) > -1) {
        logger.warning("Someone dismissed me :(")
        sendMessage(client, event.event.room_id, "Au revoir ! 😭")
        client.leave(event.event.room_id).catch(e => logger.error(e));
        return
    }

    if (event.sender) {
        sendMessage(client, GMCD_INFRA_ROOM_ID, "Bonjour " + event.sender.name + ", en quoi puis-je aider ?")
    }
}
