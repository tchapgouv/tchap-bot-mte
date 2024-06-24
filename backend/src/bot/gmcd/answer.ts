import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../utils/logger.js";
import {sendMessage} from "../common/helper.js";
import {norrisIfAsked} from "./scripts/norris.js";
import {promoteUserIfAsked} from "../common/scripts/promote.js";
import {helpIfAsked} from "./scripts/help.js";
import {bePoliteIfNecessary} from "../common/scripts/gallantry.js";
import {leaveRoomIfAsked} from "../common/scripts/leave.js";
import {createWebhookIfAsked} from "../common/scripts/webhoook.js";
import {deleteRoomIfAsked} from "../common/scripts/delete.js";
import {downgradeIfAsked} from "../common/scripts/downgrade.js";

export function parseMessage(client: MatrixClient, event: MatrixEvent):void {

    const message: string | undefined = event.event.content?.body.toLowerCase()
    const roomId = event.event.room_id

    if (!roomId || !message || !event.sender) return

    bePoliteIfNecessary(client, event, message)
    norrisIfAsked(client, roomId, message)
}

export function parseMessageToSelf(client: MatrixClient, event: MatrixEvent):void {

    const message: string | undefined = event.event.content?.body.toLowerCase()
    const roomId = event.event.room_id
    let actionTaken = false

    if (!roomId || !message || !event.sender) return

    logger.debug("body =", message)
    logger.debug("room_id =", roomId)

    if (!actionTaken) actionTaken = leaveRoomIfAsked(client, roomId, event.sender.userId, message)
    if (!actionTaken) actionTaken = createWebhookIfAsked(client, event, message)
    if (!actionTaken) actionTaken = promoteUserIfAsked(client, event, message)
    if (!actionTaken) actionTaken = helpIfAsked(client, event, message)
    if (!actionTaken) actionTaken = downgradeIfAsked(client, event, message)
    if (!actionTaken) actionTaken = deleteRoomIfAsked(client, roomId, event.sender.userId, message)
    if (!actionTaken) sendMessage(client, roomId, "Bonjour " + event.sender.name + ", en quoi puis-je aider ?")
}
