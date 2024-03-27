import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../utils/logger.js";
import {sendMessage} from "./helper.js";
import {sayGoodbyeIfNecessary} from "./scripts/gallantry.js";
import {norrisIfAsked} from "./scripts/norris.js";
import {promoteUserIfAsked} from "./scripts/promote.js";
import {createWebhookIfAsked} from "./scripts/webhoook.js";
import {leaveRoomIfAsked} from "./scripts/leave.js";

export function parseMessage(client: MatrixClient, event: MatrixEvent) {

    logger.debug("Parsing Message")

    const message: string | undefined = event.event.content?.body.toLowerCase()
    const roomId = event.event.room_id

    if (!roomId || !message || !event.sender) return

    sayGoodbyeIfNecessary(client, event, message)
    norrisIfAsked(client, roomId, message)
}

export function parseMessageToSelf(client: MatrixClient, event: MatrixEvent) {

    logger.debug("Parsing Message To Self")

    const message: string | undefined = event.event.content?.body.toLowerCase()
    const roomId = event.event.room_id
    let actionTaken = false

    if (!roomId || !message || !event.sender) return

    logger.debug("body =", message)
    logger.debug("room_id =", roomId)

    if (!actionTaken) actionTaken = leaveRoomIfAsked(client, roomId, message)
    if (!actionTaken) actionTaken = promoteUserIfAsked(client, event, message)
    if (!actionTaken) actionTaken = createWebhookIfAsked(client, event, message)
    if (!actionTaken) sendMessage(client, roomId, "Bonjour " + event.sender.name + ", en quoi puis-je aider ?")
}
