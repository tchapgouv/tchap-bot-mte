import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../utils/logger.js";
import {bePoliteIfHeard} from "../common/scripts/gallantry.js";
import {leaveRoomIfAsked} from "../common/scripts/leave.js";
import {createWebhookIfAsked} from "../common/scripts/webhoook.js";
import {promoteUserIfAsked} from "../common/scripts/promote.js";
import {helpIfAsked} from "./scripts/help.js";
import {deleteRoomIfAsked} from "../common/scripts/delete.js";
import {downgradeIfAsked} from "../common/scripts/downgrade.js";
import {Brain} from "../common/Brain.js";
import {RoomMember} from "matrix-js-sdk/lib/models/room-member.js";
import {pingService} from "../common/scripts/pingService.js";

export function parseMessage(client: MatrixClient, event: MatrixEvent, _brain:Brain, _data: { message:string, sender: RoomMember; botId: string; roomId: string }): void {

    const message: string | undefined = event.event.content?.body.toLowerCase()
    const roomId = event.event.room_id

    if (!roomId || !message || !event.sender) return

    bePoliteIfHeard(client, event, message)
    pingService(client, event, message)
    // Actions propres au Bot
}

export function parseMessageToSelf(client: MatrixClient, event: MatrixEvent, _brain:Brain, _data: { message:string, sender: RoomMember; botId: string; roomId: string }): void {

    const message: string | undefined = event.event.content?.body.toLowerCase()
    const roomId = event.event.room_id
    let actionTaken = false

    if (!roomId || !message || !event.sender) return

    logger.debug("parseMessageToSelf: body =", message)
    logger.debug("parseMessageToSelf : room_id =", roomId)

    if (!actionTaken) actionTaken = leaveRoomIfAsked(client, roomId, event.sender.userId, message)
    if (!actionTaken) actionTaken = createWebhookIfAsked(client, event, message)
    if (!actionTaken) actionTaken = promoteUserIfAsked(client, event, message)
    if (!actionTaken) actionTaken = helpIfAsked(client, event, message)
    if (!actionTaken) actionTaken = downgradeIfAsked(client, event, message)
    if (!actionTaken) actionTaken = deleteRoomIfAsked(client, roomId, event.sender.userId, message)
    // Actions propres au Bot

    // Default
    if (!actionTaken) logger.debug("parseMessageToSelf : No action taken") // sendMessage(client, roomId, "Bonjour " + event.sender.name + ", en quoi puis-je aider ?")
}
