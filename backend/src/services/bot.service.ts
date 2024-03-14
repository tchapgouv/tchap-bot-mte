import bot from "../bot/gmcd/bot.js";
import vm from "vm"
import {Preset, Visibility} from "matrix-js-sdk";
import logger from "../utils/logger.js";
import {getMailsForUIDs} from "./ldap.service.js";
import {IWebResponse} from "../utils/IWebResponse.js";


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

            let message: string = ""
            let roomId: string = ""

            await bot.getRoomIdForAlias("#" + roomName + ":" + process.env.TCHAP_SERVER_NAME).then((data) => {
                roomId = data.room_id
                message += roomName + " existait déjà et n'a pas été créée.\n"
            }).catch(reason => logger.notice("Room not found", reason))

            // let inviteErrors: { mail: string; reason: string; }[] = []

            let userMailList: string[] = []
            await getMailsForUIDs(userList)
                .then(data => {
                    userMailList = data.userMailList
                    for (const username of data.userNotFoundList) {
                        if (username.includes("@")) {
                            userList.push(username)
                            message += "Attention, " + username + ", n'a pas été trouvé dans le LDAP, mais ressemble à une adresse mail. Une invitation sera tentée.\n"
                            // inviteErrors.push({mail: username, reason: "No match in LDAP but seams to be an email address"})
                        } else {
                            message += "Attention, " + username + ", n'a pas été trouvé dans le LDAP, aucune invitation ne sera faite !\n"
                            // inviteErrors.push({mail: username, reason: "No match in LDAP !"})
                        }
                    }
                })
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

            logger.debug("userInviteList : ", userInviteList)

            if (!roomId) {
                await bot.createRoom({
                    name: roomName,
                    room_alias_name: roomName,
                    preset: Preset.TrustedPrivateChat,
                    invite_3pid: userInviteList,
                    visibility: Visibility.Private,
                })
                    .then((data) => {
                        logger.notice("Room created : ", data)
                        message += roomName + "a été créée. Vous pouvez relancer la commande pour avoir plus de détails concernant les invitations.\n"
                        // roomId = data.room_id
                        resolve({status: 200, message: "Room created", data: message})
                    })
                    .catch(reason => {
                        logger.error("Error creating room " + roomName + ". ", reason)
                        message += "Erreur lors de la création : " + JSON.stringify(reason)
                        reject(message)
                    })
            }

            for (const userMail of userMailList) {

                if (!userMail) continue

                logger.notice("Inviting " + userMail + " into " + roomName + "(" + roomId + ")")
                await bot.inviteByEmail(roomId, userMail)
                    .then(() => {
                        logger.notice(userMail + " successfully invited.")
                        message += " - " + userMail + " invité.\n"
                    })
                    .catch(reason => {
                        logger.error("Error inviting " + userMail, reason)
                        if (!reason.data.error.includes("already in the room")) {
                            // inviteErrors.push({mail: userMail, reason: reason})
                            message += " - ERREUR : " + userMail + " : " + reason.data.error + "\n"
                        } else {
                            message += " - " + userMail + " était déjà présent.\n"
                        }
                    })
            }

            resolve({status: 200, message: "Room created", data: message})
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
