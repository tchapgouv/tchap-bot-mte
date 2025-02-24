import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../utils/logger.js";
import {sendMessage} from "../common/helper.js";
import {norrisIfHeard} from "./scripts/norris.js";
import {promoteUserIfAsked} from "../common/scripts/promote.js";
import {helpIfAsked} from "./scripts/help.js";
import {bePoliteIfHeard} from "../common/scripts/gallantry.js";
import {leaveRoomIfAsked} from "../common/scripts/leave.js";
import {createWebhookIfAsked} from "../common/scripts/webhoook.js";
import {deleteRoomIfAsked} from "../common/scripts/delete.js";
import {downgradeIfAsked} from "../common/scripts/downgrade.js";
import {ollama} from "./scripts/ollama.js";
import {createLdapUsersListIfAsked} from "../common/scripts/ldapGroup/createLdapGroup.js";
import {deleteLdapUsersListIfAsked} from "../common/scripts/ldapGroup/deleteLdapGroup.js";
import {updateRoomUsersListIfAsked} from "../common/scripts/updateGroupMembers.js";
import {Brain} from "../common/Brain.js";
import {createMailUsersListIfAsked} from "../common/scripts/melListGroup/createMelListGroup.js";
import {deleteMailUsersListIfAsked} from "../common/scripts/melListGroup/deleteMelListGroup.js";
import {createAliasIfAsked} from "../common/scripts/aliases/createAlias.js";
import {deleteAliasIfAsked} from "../common/scripts/aliases/deleteAlias.js";
import {listAliasIfAsked} from "../common/scripts/aliases/listAlias.js";
import {listServicesIfAsked} from "../common/scripts/listService.js";
import {getServicesIfAsked} from "../common/scripts/getService.js";
import {pingService} from "../common/scripts/pingService.js";
import {BotMessageData} from "../common/BotMessageData.js";
import {extractHistoryIfAsked} from "./scripts/extract.js";
import {inviteInRoomIfAsked} from "../common/scripts/invite.js";

export function parseMessage(client: MatrixClient, event: MatrixEvent, _brain: Brain, data: BotMessageData): void {

    const message: string | undefined = event.event.content?.body.toLowerCase()
    const roomId = event.event.room_id

    if (!roomId || !message || !event.sender) return

    bePoliteIfHeard(client, event, data.message)
    pingService(client, event, data.message)

    // Actions propres au Bot

    norrisIfHeard(client, roomId, data.message)
}

export function parseMessageToSelf(client: MatrixClient, event: MatrixEvent, brain: Brain, data: BotMessageData): void {

    let actionTaken = false

    logger.debug("parseMessageToSelf: body =", data.message)
    logger.debug("parseMessageToSelf: room_id =", data.roomId)

    if (!actionTaken) actionTaken = leaveRoomIfAsked(client, data.roomId, data.sender.userId, data.message)
    if (!actionTaken) actionTaken = createWebhookIfAsked(client, event, data.message)
    if (!actionTaken) actionTaken = promoteUserIfAsked(client, event, data.message)
    if (!actionTaken) actionTaken = helpIfAsked(client, event, data.message)
    if (!actionTaken) actionTaken = downgradeIfAsked(client, event, data.message)
    if (!actionTaken) actionTaken = deleteRoomIfAsked(client, data.roomId, data.sender.userId, data.message)

    if (!actionTaken) actionTaken = createAliasIfAsked(client, event, data.message)
    if (!actionTaken) actionTaken = deleteAliasIfAsked(client, event, data.message)
    if (!actionTaken) actionTaken = listAliasIfAsked(client, event, data.message)

    if (!actionTaken) actionTaken = listServicesIfAsked(client, event, data.message)
    if (!actionTaken) actionTaken = getServicesIfAsked(client, event, data.message, data.formatted_message)

    if (!actionTaken) actionTaken = createLdapUsersListIfAsked(client, event, data.message, brain)
    if (!actionTaken) actionTaken = deleteLdapUsersListIfAsked(client, event, data.message)

    if (!actionTaken) actionTaken = createMailUsersListIfAsked(client, event, data.message, brain)
    if (!actionTaken) actionTaken = deleteMailUsersListIfAsked(client, event, data.message)

    if (!actionTaken) actionTaken = updateRoomUsersListIfAsked(client, event, data.message)

    if (!actionTaken) actionTaken = extractHistoryIfAsked(client, data.roomId, data.message)

    // Admin only

    if (!actionTaken) actionTaken = inviteInRoomIfAsked(client, data.roomId, data.sender.userId, data.message, data.raw_message)

    // Actions propres au Bot

    if (!actionTaken) actionTaken = ollama(client, data.roomId, data.sender, data.message)

    // Default

    if (!actionTaken) sendMessage(client, data.roomId, "Bonjour " + data.sender.name + ", en quoi puis-je aider ?")
}
