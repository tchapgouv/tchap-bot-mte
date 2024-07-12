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
import {ollama} from "./scripts/ollama.js";
import {createRoomUsersListIfAsked} from "../common/scripts/createLdapGroup.js";
import {deleteRoomUsersListIfAsked} from "../common/scripts/deleteLdapGroup.js";
import {updateRoomUsersListIfAsked} from "../common/scripts/updateLdapGroup.js";
import {Brain} from "../common/Brain.js";
import {RoomMember} from "matrix-js-sdk/lib/models/room-member.js";

export function parseMessage(client: MatrixClient, event: MatrixEvent, _brain: Brain, data: { message:string, sender: RoomMember; botId: string; roomId: string }): void {

    bePoliteIfNecessary(client, event, data.message)
    // Actions propres au Bot
    norrisIfAsked(client, data.roomId, data.message)
}

export function parseMessageToSelf(client: MatrixClient, event: MatrixEvent, brain: Brain, data: { message:string, sender: RoomMember; botId: string; roomId: string }): void {

    let actionTaken = false

    logger.debug("parseMessageToSelf: body =", data.message)
    logger.debug("parseMessageToSelf: room_id =", data.roomId)

    if (!actionTaken) actionTaken = leaveRoomIfAsked(client, data.roomId, data.sender.userId, data.message)
    if (!actionTaken) actionTaken = createWebhookIfAsked(client, event, data.message)
    if (!actionTaken) actionTaken = promoteUserIfAsked(client, event, data.message)
    if (!actionTaken) actionTaken = helpIfAsked(client, event, data.message)
    if (!actionTaken) actionTaken = downgradeIfAsked(client, event, data.message)
    if (!actionTaken) actionTaken = deleteRoomIfAsked(client, data.roomId, data.sender.userId, data.message)

    if (!actionTaken) actionTaken = createRoomUsersListIfAsked(client, event, data.message, brain)
    if (!actionTaken) actionTaken = deleteRoomUsersListIfAsked(client, event, data.message)
    if (!actionTaken) actionTaken = updateRoomUsersListIfAsked(client, event, data.message)

    // Actions propres au Bot
    if (!actionTaken) actionTaken = ollama(client, data.roomId, data.sender, data.message)

    // Default
    if (!actionTaken) sendMessage(client, data.roomId, "Bonjour " + data.sender.name + ", en quoi puis-je aider ?")
}
