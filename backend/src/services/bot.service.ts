import bot from "../bot/gmcd/bot.js";
import vm from "vm"
import {Preset, Visibility} from "matrix-js-sdk";
import logger from "../utils/logger.js";
import {getMailsForUIDs} from "./ldap.service.js";
import {IWebResponse} from "../utils/IWebResponse.js";
import {sendMessage} from "../bot/gmcd/helper.js";
import {getIdentityServerToken} from "../bot/gmcd/init.js";

async function runScript(script: string, message: string) {

    const context = {'data': message};
    vm.createContext(context); // Contextify the object.
    await vm.runInContext(script, context);

    // console.log(context.data);
    return context.data
}

async function createRoomAndInvite(roomName: string, userList: string[], roomId?: string): Promise<IWebResponse> {

    return new Promise((resolve, reject) => {
        (async () => {

            let message: string = "\n"

            if (!roomId) {
                await bot.getRoomIdForAlias("#" + roomName + ":" + process.env.TCHAP_SERVER_NAME).then((data) => {
                    roomId = data.room_id
                    message += roomName + " existait déjà et n'a pas été créé.\n"
                }).catch(reason => logger.notice("Room not found", reason))
            }

            if (!roomId) {
                await bot.createRoom({
                    name: roomName,
                    room_alias_name: roomName,
                    preset: Preset.TrustedPrivateChat,
                    power_level_content_override: {
                        users_default: 50
                    },
                    // invite_3pid: userInviteList,
                    visibility: Visibility.Private,
                })
                    .then((data) => {
                        logger.notice("Room created : ", data)
                        message += roomName + " a été créé. ✌️\n"
                        message += "Ce salon est privé, à ce titre il est crypté.\n"
                        message += "Attention, notez que les utilisateurs invités par le bot sont tous modérateurs. Vous pouvez changer ce comportement par défaut en modifiant `Rôle par défaut` dans les paramètres du salon.\n"
                        message += "Vous pouvez vous promouvoir administrateur simplement en me le demandant : `@bot-gmcd promote me`. 🍄\n"
                        message += "Enfin, vous pouvez me renvoyer : `@bot-gmcd oust !`. 🪦\n"
                        roomId = data.room_id
                    })
                    .catch(reason => {
                        logger.error("Error creating room " + roomName + ". ", reason)
                        message += "Erreur lors de la création : " + JSON.stringify(reason)
                        reject(message)
                    })
            }

            message += "\n"
            message += "Bonne journée !\n"
            message += "\n"
            message += "\n"
            message += "Rapport d'invitations : \n"

            let userMailList: string[] = []
            await getMailsForUIDs(userList)
                .then(data => {
                    userMailList = data.userMailList
                    for (const username of data.userNotFoundList) {
                        if (username.includes("@")) {
                            userList.push(username)
                            message += " ❔ " + username + ", n'a pas été trouvé dans le LDAP, mais ressemble à une adresse mail. Une invitation a été tentée.\n"
                            // inviteErrors.push({mail: username, reason: "No match in LDAP but seams to be an email address"})
                        } else {
                            message += " ❓️ " + username + ", n'a pas été trouvé dans le LDAP, aucune invitation n'a été faite !\n"
                            // inviteErrors.push({mail: username, reason: "No match in LDAP !"})
                        }
                    }
                })
                .catch(reason => {
                    logger.error("createRoomAndInvite : ", reason)
                    reject(reason)
                })

            // Maj du token préventivement afin d’éviter de multiples appels en parallèle
            await getIdentityServerToken()

            await Promise.all(userMailList.map(async (userMail) => {
                if (!userMail) return

                logger.notice("Inviting " + userMail + " into " + roomName + "(" + roomId + ")")
                if (roomId != null) {
                    await bot.inviteByEmail(roomId, userMail)
                        .then(() => {
                            logger.notice(userMail + " successfully invited.")
                            message += " ✅ " + userMail + " invité.\n"
                        })
                        .catch(reason => {
                            logger.error("Error inviting " + userMail, reason)
                            if (!reason.data.error.includes("already in the room")) {
                                message += " ❗️ " + userMail + ", " + reason.data.error + "\n"
                            } else {
                                message += " 🤷 " + userMail + " était déjà présent.\n"
                            }
                        })
                }
            })).catch(reason => {
                logger.error("Promise.all(inviteByEmail) : ", reason)
                reject(reason)
            })

            if (roomId != null) {
                sendMessage(bot, roomId, message)
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
