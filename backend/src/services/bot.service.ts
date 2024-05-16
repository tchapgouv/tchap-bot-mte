import gmcdBot from "../bot/gmcd/bot.js";
import psinBot from "../bot/psin/bot.js";
import vm from "vm"
import {Visibility} from "matrix-js-sdk";
import logger from "../utils/logger.js";
import ldapService from "./ldap.service.js";
import {sendHtmlMessage, sendMarkdownMessage, sendMessage} from "../bot/common/helper.js";
import {Bot} from "../bot/common/Bot.js";

const bots: Bot[] = [
    gmcdBot,
    psinBot
]

export default {

    async runScript(script: string, message: any) {

        const context = {'data': message};
        vm.createContext(context); // Contextualize the object.
        await vm.runInContext(script, context);

        return context.data
    },

    async createRoom(roomName: string) {

        let message: string = ""
        let roomId: any

        await gmcdBot.client.getRoomIdForAlias("#" + roomName + ":" + process.env.TCHAP_SERVER_NAME).then((data) => {
            roomId = data.room_id
            message += roomName + " existait déjà et n'a pas été créé.\n"
        }).catch(reason => logger.notice("Room not found", reason))

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

        if (roomId != null) {
            await sendMessage(gmcdBot.client, roomId, message)
        }

        return {roomId, message}
    },

    async getRoomName(roomId: string) {
        const roomName = gmcdBot.client.getRoom(roomId)?.name

        if (!roomName) throw "Cannot find room name for Id : " + roomId + ". Do I know this room ?"

        return roomName
    },

    async createRoomAndInvite(roomName: string, userList: string[], roomId?: string): Promise<void> {

        ({roomId} = await this.createRoom(roomName))

        if (!roomId) throw "createRoomAndInvite : roomId should not be null here, something went really wrong !"

        await this.invite(userList, roomId)
    },

    async invite(userList: string[], roomId: string): Promise<void> {

        const isMemberOfRoom = await this.isMemberOfRoom(gmcdBot.client.getUserId(), roomId)

        if (!isMemberOfRoom) throw "I am not able to invite has i am not a member of the room !"

        const roomName = await this.getRoomName(roomId)

        let message: string = "Rapport d'invitations : \n"

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

        if (hasExternal) {
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

        })).catch(reason => {
            logger.error("Promise.all(inviteByEmail) : ", reason)
            throw (reason)
        })

        await sendMessage(gmcdBot.client, roomId, message)
    },

    async postMessage(roomId: string,
                      message: { formattedMessage: string; rawMessage: string | undefined },
                      botId: string,
                      opts: { messageFormat: string } = {messageFormat: "text"}): Promise<{ message: string } | void> {

        let client
        for (const bot of bots) {
            if (bot.client.getUserId() === botId) client = bot.client
        }
        if (!client) client = gmcdBot.client

        logger.info("Posting message")

        let promise
        switch (opts.messageFormat) {
            case "html":
                promise = sendHtmlMessage(client, roomId, message.rawMessage || message.formattedMessage, message.formattedMessage)
                break
            case "md":
            case "markdown":
                promise = sendMarkdownMessage(client, roomId, message.formattedMessage)
                break
            default:
                promise = sendMessage(client, roomId, message.formattedMessage)
        }

        return await promise.then(() => {
            return {message: "Message sent"}
        }).catch(reason => logger.error("Error occurred sending webhook message to room ;", roomId, "message :", message, "reason :", reason))
    },

    async isMemberOfRoom(roomId: string | null, userId: string | null) {

        if (!roomId) throw "isMemberOfRoom ? roomId cannot be empty"

        let isMember = false

        await gmcdBot.client.getJoinedRoomMembers(roomId)
            .then(value => {
                isMember = !!value.joined[userId ? userId : "" + process.env.BOT_USER_ID]
            })
            .catch(reason => {
                logger.error("isMemberOfRoom", reason)
                isMember = false
            })

        return isMember
    }
}
