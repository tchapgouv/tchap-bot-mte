import bot from "../bot/gmcd/bot.js";
import vm from "vm"
import {Preset, Visibility} from "matrix-js-sdk";
import logger from "../utils/logger.js";
import {getMailsForUIDs} from "./ldap.service.js";
import {IWebResponse} from "../utils/IWebResponse.js";
import {inviteByMail} from "../bot/gmcd/helper.js";


async function runScript(script: string, message: string) {

    const context = {'data': message};
    vm.createContext(context); // Contextify the object.
    await vm.runInContext(script, context);

    // console.log(context.data);
    return context.data
}

async function createRoomAndInvite(roomName: string, userList: string[]): Promise<IWebResponse> {

    return new Promise((resolve, reject) => {
        (async () => {
            let roomId: string = ""

            await bot.getRoomIdForAlias("#" + roomName + ":" + process.env.TCHAP_SERVER_NAME).then((data) => {
                roomId = data.room_id
            }).catch(reason => logger.notice("Room not found", reason))

            let userMailList: string[] = []
            await getMailsForUIDs(userList)
                .then(mails => userMailList = mails)
                .catch(reason => {
                    logger.error("createRoomAndInvite : ", reason)
                    reject(reason)
                })

            let userInviteList: {
                id_server: string,
                medium: string,
                address: string
            }[] = userMailList.map(mail => {
                return {
                    id_server: bot.getHomeserverUrl(),
                    medium: "email",
                    address: mail
                }
            });

            logger.debug(userInviteList)

            // inviteByMail(bot, roomName, )

            if (!roomId) {
                await bot.createRoom({
                    name: roomName,
                    room_alias_name: roomName,
                    preset: Preset.TrustedPrivateChat,
                    // invite_3pid: userInviteList,
                    visibility: Visibility.Private,
                })
                    .then((data) => {
                        logger.notice("Room created : ", data)
                        roomId = data.room_id
                    })
                    .catch(reason => {
                        logger.error("Error creating room " + roomName + ". ", reason)
                        reject(reason)
                    })
            }

            let inviteErrors: { mail: string; reason: string; }[] = []

            for (const userMail of userMailList) {

                if (!userMail) continue

                logger.notice("Inviting " + userMail + " into " + roomName + "(" + roomId + ")")
                inviteByMail(bot, roomId, userMail)
                // await bot.inviteByEmail(roomId, userMail)
                //     .then(() => {
                //         logger.notice(userMail + " successfully invited.")
                //     })
                //     .catch(reason => {
                //         logger.error("Error inviting " + userMail + ". ", reason)
                //         inviteErrors.push({mail: userMail, reason: reason})
                //     })
            }

            resolve({status: 200, message: "Room created", data: {invite_errors: inviteErrors}})
        })()
    })
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
