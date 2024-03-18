import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../utils/logger.js";
import {sendMessage} from "./helper.js";
import {sayGoodbyeIfNecessary} from "./scripts/gallantry.js";
import {norrisIfAsked} from "./scripts/norris.js";

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
    let shallContinue = true

    if (!roomId || !message || !event.sender) return

    logger.debug("body =", message)
    logger.debug("room_id =", roomId)

    if (shallContinue) shallContinue = !leaveRoomIfAsked(client, roomId, message)
    if (shallContinue) sendMessage(client, roomId, "Bonjour " + event.sender.name + ", en quoi puis-je aider ?")
}

function leaveRoomIfAsked(client: MatrixClient, roomId: string, body: string) {

    const leaveRoomOptions = ["oust"]
    if (roomId && body && leaveRoomOptions.some(option => body.includes(option))) {
        logger.warning("Someone dismissed me :(")
        sendMessage(client, roomId, "Au revoir ! 😭")
        client.leave(roomId).catch(e => logger.error(e));
        return true
    }
    return false
}
