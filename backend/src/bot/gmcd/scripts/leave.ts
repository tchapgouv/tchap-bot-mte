import {MatrixClient} from "matrix-js-sdk";
import logger from "../../../utils/logger.js";
import {sendMessage} from "../helper.js";


export function leaveRoomIfAsked(client: MatrixClient, roomId: string, body: string) {

    const leaveRoomOptions = ["oust"]

    if (roomId && body && leaveRoomOptions.some(option => body.includes(option))) {

        logger.warning("Someone dismissed me :(")
        sendMessage(client, roomId, "Au revoir ! 😭")
        client.leave(roomId).catch(e => logger.error(e));

        return true
    }
    return false
}
