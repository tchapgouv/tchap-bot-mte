import bot from "../bot/gmcd/bot.js";
import vm from "vm"
import {Visibility} from "matrix-js-sdk";
import logger from "../utils/logger.js";
import {getMailsForUIDs} from "./ldap.service.js";


async function runScript(script: string, message: string) {

    const context = {'data': message};
    vm.createContext(context); // Contextify the object.
    await vm.runInContext(script, context);

    // console.log(context.data);
    return context.data
}

async function createRoomAndInvite(roomName: string, userList: string[]) {

    let roomId: string = ""

    await bot.getRoomIdForAlias(roomName).then((data) => {
        roomId = data.room_id
    }).catch(reason => logger.notice("Room not found", reason))

    if (!roomId) {
        await bot.createRoom({
            name: roomName,
            visibility: Visibility.Private
        })
            .then((data) => {
                logger.notice("Room created : ", data)
                roomId = data.room_id
            })
            .catch(reason => {
                logger.error("Error creating room " + roomName + ". ", reason)
                return {status: 500, message: "Error creating room " + roomName + ". "}
            })
    }

    if (!roomId) {
        logger.error("Room id not found, cannot invite users ! ")
        return {status: 500, message: "Room id not found, cannot invite users ! "}
    }

    let userMailList: string[] = []
    await getMailsForUIDs(userList).then(mails => userMailList = mails).catch(reason => logger.error("createRoomAndInvite : ", reason))

    let inviteError: { mail: string; reason: string; }[] = []

    for (const userMail in userMailList) {
        logger.notice("Inviting " + userMail + " into " + roomName + "(" + roomId + ")")
        await bot.inviteByEmail(roomId, userMail)
            .then(() => logger.notice(userMail + " successfully invited."))
            .catch(reason => {
                logger.error("Error inviting " + userMail + ". ", reason)
                inviteError.push({mail: userMail, reason: reason})
            })
    }

    return {status: 200, message: "Room created", invite_errors: inviteError}
}


async function postMessage(roomId: string, message: string, script: string) {

    // console.log('message before script : ', message);
    await runScript(script, message).then(data => message = data)
    // console.log('message after script : ', message);

    return await bot.sendTextMessage(roomId, message).then(() => {
        return {message: "Message sent"}
    }).catch(e => logger.error(e))
}

export {postMessage, createRoomAndInvite}
