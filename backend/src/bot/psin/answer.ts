import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../utils/logger.js";
import {bePoliteIfHeard} from "../common/scripts/gallantry.js";
import {leaveRoomIfAsked} from "../common/scripts/leave.js";
import {createWebhookIfAsked} from "../common/scripts/webhoook.js";
import {promoteUserIfAsked} from "../common/scripts/promote.js";
import {helpIfAsked} from "./scripts/help.js";
import {deleteRoomIfAsked} from "../common/scripts/delete.js";
import {downgradeIfAsked} from "../common/scripts/downgrade.js";
import {listIncidentsIfAsked} from "./scripts/incidents.js";
import {statsIfAsked} from "./scripts/stats.js";
import {Brain} from "../common/Brain.js";
import {sendMarkdownMessage} from "../common/helper.js";
import {contactsIfAsked} from "./scripts/contacts.js";
import {statutIfAsked} from "./scripts/statut.js";
import {pingService} from "../common/scripts/pingService.js";
import {listServicesIfAsked} from "../common/scripts/listService.js";
import {getServicesIfAsked} from "../common/scripts/getService.js";
import {BotMessageData} from "../common/BotMessageData.js";

export function parseMessage(client: MatrixClient, event: MatrixEvent, _brain: Brain, data: BotMessageData): void {

    if (!data.roomId || !data.message || !event.sender) return

    bePoliteIfHeard(client, event, data.message)
    pingService(client, event, data.message)

    // Actions propres au Bot

}

export function parseMessageToSelf(client: MatrixClient, event: MatrixEvent, _brain: Brain, data: BotMessageData): void {

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

    if (!actionTaken) actionTaken = listServicesIfAsked(client, event, data.message)
    if (!actionTaken) actionTaken = getServicesIfAsked(client, event, data.message, data.formatted_message)

    // Actions propres au Bot

    if (!actionTaken) actionTaken = listIncidentsIfAsked(client, event, message)
    if (!actionTaken) actionTaken = statutIfAsked(client, event, message)
    if (!actionTaken) actionTaken = statsIfAsked(client, event, message)
    if (!actionTaken) actionTaken = contactsIfAsked(client, event, message)

    // Default

    if (!actionTaken) sendMarkdownMessage(client, roomId, "Bonjour " + event.sender.name + ", en quoi puis-je aider ?\nVous pouvez me demander la liste des commandes accessibles ainsi :\n `@bot-psin aide moi !!` 😊.")
}
