import {MatrixClient, Visibility} from "matrix-js-sdk";
import logger from "../../utils/logger.js";


function createRoomAndInvite(client:MatrixClient, roomName: string, userMailList: string[]) {
    let roomId

    client.getRoomIdForAlias(roomName).then((data) => {
        roomId = data.room_id
    })

    if (!roomId) {
        client.createRoom({
            name: roomName,
            visibility: Visibility.Private
        })
            .then((data) => {
                roomId = data.room_id
            })
            .catch(reason => logger.error("Error creating room " + roomName + ". ", reason))
    }

    if (!roomId) {
        logger.error("Room id not found, cannot import users ! ")
        return
    }

    for (const userMail in userMailList) {
        client.inviteByEmail(roomId, userMail)
            .then(() => logger.notice(userMail + " successfully invited."))
            .catch(reason => logger.error("Error inviting " + userMail + ". ", reason))
    }

}
