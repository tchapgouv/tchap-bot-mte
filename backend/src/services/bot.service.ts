import gmcdBot from "../bot/gmcd/bot.js";
import gmcdBotConfig from "../bot/gmcd/config.js";
import psinBot from "../bot/psin/bot.js";
import vm from "vm"
import {MatrixClient, Visibility} from "matrix-js-sdk";
import logger from "../utils/logger.js";
import ldapService from "./ldap.service.js";
import {getPowerLevel, sendHtmlMessage, sendMarkdownMessage, sendMessage} from "../bot/common/helper.js";
import {Bot} from "../bot/common/Bot.js";

const bots: Bot[] = [
    gmcdBot,
    psinBot
]

const rateLimit = 100
const rateLimitDelay = 60 / rateLimit * 1000

export default {

    async runScript(script: string, message: any) {

        const context = {'data': message};
        vm.createContext(context); // Contextualize the object.
        await vm.runInContext(script, context);

        return context.data
    },

    async inviteUserInRoom(userMail: string, roomId: string, retries: number = 5) {

        let message = ""

        const roomName = await this.getRoomName(roomId)

        if (!userMail) return message

        logger.notice("Inviting " + userMail + " into " + roomName + "(" + roomId + "). retries " + retries + "/4")
        let invited = false
        let tries = 0
        while (!invited && tries <= retries) {
            await gmcdBot.client.inviteByEmail(roomId, userMail)
                .then(() => {
                    logger.notice(userMail + " successfully invited.")
                    invited = true
                    message = " ✅ " + userMail + " invité.\n"
                })
                .catch(reason => {
                    if (reason.data?.error?.includes("already in the room")) {
                        message = " 🤷 " + userMail + " était déjà présent.\n"
                        invited = true
                    } else {
                        logger.error("Error inviting " + userMail + " will retry in 5 seconds", reason)
                        if (tries == retries) {
                            message = " ❗️ " + userMail + ", " + reason.data.error + "\n"
                        }
                    }
                })
            tries++
            if (!invited && tries <= retries) await new Promise(res => setTimeout(res, 5000));
        }

        return message;
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

    async deleteRoom(client: MatrixClient, roomId: string, kickReason?: "Quelqu'un m'a demandé de vous expulser, désole 🤷") {

        const botId = client.getUserId()

        if (!botId) throw ("deleteRoom : Bot id should not be null !")

        await getPowerLevel(client, roomId, botId).then(powerLevel => {
            if (powerLevel < 100) {
                throw ("Oups ! Désolé, je dois être administrateur afin de supprimer un salon")
            }
        })

        let adminList: { name: string, userId: string }[] = []

        client.getRoom(roomId)?.getMembers().forEach(async (roomMember) => {

            if (roomMember.userId === botId) return

            logger.debug("roomMember", roomMember)

            logger.debug(roomMember.userId + " power level  = " + roomMember.powerLevel)
            if (!roomMember.powerLevel || roomMember.powerLevel < 100) {
                logger.debug("Kicking " + roomMember.userId)
                await client.kick(roomId, roomMember.userId, kickReason)
                    .catch(reason => {
                        logger.error("Error kicking " + roomMember.name, reason)
                    })
            }

            if (roomMember.powerLevel === 100) adminList.push({name: roomMember.name, userId: roomMember.userId})
        })

        if (adminList.length > 0) sendMessage(client, roomId, "Quelques Administrateurs demeurent dans ce salon et je ne peux les exclure.\nCe salon ne sera pas purgé tant qu'ils ne l'auront pas quitté.\nN'oubliez pas d'éteindre la lumière en partant ! 💡\n 👋")
        else sendMessage(client, roomId, "🚪")

        client.leave(roomId)

        return adminList
    },

    async getRoomName(roomId: string) {
        const roomName = gmcdBot.client.getRoom(roomId)?.name

        if (!roomName) throw "Cannot find room name for Id : " + roomId + ". Do I know this room ?"

        return roomName
    },

    async inviteUsersInRoom(userList: string[], roomId: string): Promise<void> {

        const isMemberOfRoom = await this.isMemberOfRoom(roomId)

        if (!isMemberOfRoom) throw "I am not able to invite has i am not a member of the room !"

        if (!gmcdBot.client.getRoom(roomId)?.canInvite(gmcdBotConfig.userId)) throw "I am do not have permissions to invite in this room !"

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

        // on met un délai entre les invitations pour ne pas tomber sur la limite des haproxy (rate limit du endpoint en lui même = 1k/s).
        let tasks: Promise<string>[] = [];
        userMailList.map(async (userMail, index) => {
            tasks.push(new Promise(async (resolve) => {
                const delay = rateLimitDelay * index
                await new Promise(res => setTimeout(res, delay));
                await this.inviteUserInRoom(userMail, roomId).then(value => resolve(value))
            }).then(value => message += value))
        })

        await Promise.all(tasks).catch(reason => {
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

    async isMemberOfRoom(roomId: string | null, userId?: string) {

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
