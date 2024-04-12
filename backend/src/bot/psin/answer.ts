import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../utils/logger.js";
import {sayGoodbyeIfNecessary} from "../common/scripts/gallantry.js";
import {leaveRoomIfAsked} from "../common/scripts/leave.js";
import {createWebhookIfAsked} from "../common/scripts/webhoook.js";
import {sendMessage} from "../common/helper.js";

export function parseMessage(client: MatrixClient, event: MatrixEvent): void {

    const message: string | undefined = event.event.content?.body.toLowerCase()
    const roomId = event.event.room_id

    if (!roomId || !message || !event.sender) return

    sayGoodbyeIfNecessary(client, event, message)
}

export function parseMessageToSelf(client: MatrixClient, event: MatrixEvent): void {

    const message: string | undefined = event.event.content?.body.toLowerCase()
    const roomId = event.event.room_id
    let actionTaken = false

    if (!roomId || !message || !event.sender) return

    logger.debug("body =", message)
    logger.debug("room_id =", roomId)

    if (!actionTaken) actionTaken = leaveRoomIfAsked(client, roomId, message)
    if (!actionTaken) actionTaken = createWebhookIfAsked(client, event, message)
    if (!actionTaken) sendMessage(client, roomId, "Bonjour " + event.sender.name + ", en quoi puis-je aider ?")
}
