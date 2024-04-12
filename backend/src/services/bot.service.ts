import gmcdBot from "../bot/gmcd/bot.js";
import psinBot from "../bot/psin/bot.js";
import vm from "vm"
import {Visibility} from "matrix-js-sdk";
import logger from "../utils/logger.js";
import ldapService from "./ldap.service.js";
import {sendHtmlMessage, sendMessage} from "../bot/common/helper.js";
import showdown from 'showdown';
import {Bot} from "../bot/common/Bot.js";

const bots: Bot[] = [
    gmcdBot,
    psinBot
]

const converter = new showdown.Converter()

async function runScript(script: string, message: string) {

    const context = {'data': message};
    vm.createContext(context); // Contextualize the object.
    await vm.runInContext(script, context);

    // console.log(context.data);
    return context.data
}

export default {

    async createRoomAndInvite(roomName: string, userList: string[], roomId?: string): Promise<void> {

        let message: string = "\n"

        if (!roomId) {
            await gmcdBot.client.getRoomIdForAlias("#" + roomName + ":" + process.env.TCHAP_SERVER_NAME).then((data) => {
                roomId = data.room_id
                message += roomName + " existait déjà et n'a pas été créé.\n"
            }).catch(reason => logger.notice("Room not found", reason))
        }

        if (!roomId) {
            await gmcdBot.client.createRoom({
                name: roomName,
                room_alias_name: roomName,
                // preset: Preset.PrivateChat,
                power_level_content_override: {
                    // users_default: 50
                },
                visibility: Visibility.Private,
            })
                .then((data) => {
                    logger.notice("Room created : ", data)
                    message += roomName + " a été créé. ✌️\n"
                    message += "Ce salon est privé, à ce titre il est crypté.\n"
                    // message += "Attention, notez que les utilisateurs invités par le bot sont tous modérateurs. Vous pouvez changer ce comportement par défaut en modifiant `Rôle par défaut` dans les paramètres du salon.\n"
                    message += "Vous pouvez vous promouvoir administrateur simplement en me le demandant : `@bot-gmcd promote me`. 🍄\n"
                    message += "Enfin, vous pouvez me renvoyer : `@bot-gmcd oust !`. 🪦\n"
                    roomId = data.room_id
                })
                .catch(reason => {
                    logger.error("Error creating room " + roomName + ". ", reason)
                    message += "Erreur lors de la création : " + JSON.stringify(reason)
                    throw (message)
                })
        }

        message += "\n"
        message += "Bonne journée !\n"

        message += "\n"
        message += "\n"
        message += "Rapport d'invitations : \n"

        let userMailList: string[] = []
        let hasExternal = false
        await ldapService.getMailsForUIDs(userList)
            .then(data => {
                userMailList = data.userMailList
                for (const username of data.userNotFoundList) {
                    if (username.toLowerCase().includes("hubot")) continue
                    if (username.includes("@")) {
                        userMailList.push(username)
                        hasExternal = true
                        message += " ❔ " + username + ", n'a pas été trouvé dans le LDAP, mais ressemble à une adresse mail. Une invitation a été tentée.\n"
                    } else {
                        message += " ❓️ " + username + ", n'a pas été trouvé dans le LDAP, aucune invitation n'a été faite !\n"
                    }
                }
            })
            .catch(reason => {
                logger.error("createRoomAndInvite : ", reason)
                throw (reason)
            })

        logger.debug("Inviting list :", userMailList)

        if (roomId != null && hasExternal) {
            logger.notice("Setting guest access to room " + roomId)
            await gmcdBot.client.sendStateEvent(roomId, "im.vector.room.access_rules", {rule: "unrestricted"})
                .then(() => {
                    logger.notice("Guest access set for room " + roomId)
                })
        }

        // Maj du token préventivement afin d’éviter de multiples appels en parallèle
        await gmcdBot.getIdentityServerToken()

        await Promise.all(userMailList.map(async (userMail) => {
            if (!userMail) return

            logger.notice("Inviting " + userMail + " into " + roomName + "(" + roomId + ")")
            if (roomId != null) {
                await gmcdBot.client.inviteByEmail(roomId, userMail)
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
            throw (reason)
        })

        if (roomId != null) {
            await sendMessage(gmcdBot.client, roomId, message)
        }
    },


    async applyScriptAndPostMessage(roomId: string, message: string, script: string, botId: string, opts: { messageFormat: string } = {messageFormat: "text"}): Promise<{ message: string } | void> {

        logger.info("Applying script to message")

        let client
        for (const bot of bots) {
            if (bot.client.getUserId() === botId) client = bot.client
        }
        if (!client) client = gmcdBot.client

        // console.log('message before script : ', message);
        await runScript(script, message).then(data => message = data)
        // console.log('message after script : ', message);

        logger.info("Posting message")

        let promise
        switch (opts.messageFormat) {
            case "html":
                promise = sendHtmlMessage(client, roomId, message, message)
                break
            case "md":
            case "markdown":
                const htmlMessage = converter.makeHtml(message)
                promise = sendHtmlMessage(client, roomId, message, htmlMessage)
                break
            default:
                promise = sendMessage(client, roomId, message)
        }

        return await promise.then(() => {
            return {message: "Message sent"}
        }).catch(reason => logger.error("Error occurred sending webhook message to room ;", roomId, "message :", message, "reason :", reason))
    }

}
