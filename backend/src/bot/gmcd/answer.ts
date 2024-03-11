import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../utils/logger.js";
import {addEmoji, sendMessage} from "./helper.js";
import {GMCD_INFRA_ROOM_ID} from "./config.js";

export function parseMessage(client: MatrixClient, event: MatrixEvent) {

    logger.debug("Parsing Message")

    const lowerCaseBody: string | undefined = event.event.content?.body.toLowerCase()
    const roomId = event.event.room_id

    if (lowerCaseBody) sayGoodbyeIfNecessary(client, event, lowerCaseBody)

}

function sayGoodbyeIfNecessary(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(bonne soirée|[aà] demain|bon we|bonsoir).*/i
    let shallContinue = true

    if (shallContinue && body && regex.test(body)) {
        logger.debug("Saying goodbye.")
        addEmoji(client, event, "👋");
    }
}

export function parseMessageToSelf(client: MatrixClient, event: MatrixEvent) {

    logger.debug("Parsing Message To Self")

    const lowerCaseBody: string | undefined = event.event.content?.body.toLowerCase()
    const roomId = event.event.room_id
    let shallContinue = true

    logger.debug("body =", lowerCaseBody)
    logger.debug("room_id =", roomId)

    if (shallContinue && roomId && lowerCaseBody) shallContinue = !maybeLeaveRoom(client, roomId, lowerCaseBody)

    if (shallContinue && event.sender) {
        sendMessage(client, GMCD_INFRA_ROOM_ID, "Bonjour " + event.sender.name + ", en quoi puis-je aider ?")
    }
}

function maybeLeaveRoom(client: MatrixClient, roomId: string, body: string) {

    const leaveRoomOptions = ["oust"]
    if (roomId && body && leaveRoomOptions.some(option => body.includes(option))) {
        logger.warning("Someone dismissed me :(")
        sendMessage(client, roomId, "Au revoir ! 😭")
        client.leave(roomId).catch(e => logger.error(e));
        return true
    }
    return false
}
