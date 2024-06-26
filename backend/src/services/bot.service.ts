import gmcdBot from "../bot/gmcd/bot.js";
import gmcdBotConfig from "../bot/gmcd/config.js";
import psinBot from "../bot/psin/bot.js";
import vm from "vm"
import {MatrixClient, Visibility} from "matrix-js-sdk";
import logger from "../utils/logger.js";
import ldapService from "./ldap.service.js";
import {getPowerLevel, sendHtmlMessage, sendMarkdownMessage, sendMessage} from "../bot/common/helper.js";
import {Bot} from "../bot/common/Bot.js";
import {splitEvery} from "../utils/utils.js";
import {RoomMember} from "matrix-js-sdk/lib/models/room-member.js";

const bots: Bot[] = [
    gmcdBot,
    psinBot
]

const rateLimit = 10
const rateLimitDelay = 60 / rateLimit * 1000

export default {

    async runScript(script: string, message: any) {

        const context = {'data': message};
        vm.createContext(context); // Contextualize the object.
        await vm.runInContext(script, context);

        return context.data
    },

    async inviteUserInRoom(userMail: string, roomId: string, opts = {retries: 0, logAlreadyInvited: true}) {

        logger.debug("inviteUserInRoom", userMail, roomId, opts)

        let message = ""

        const roomName = await this.getRoomName(roomId)

        if (!userMail) return {message, hasError: true}

        logger.notice("Inviting " + userMail + " into " + roomName + " (" + roomId + "). retries " + opts.retries)
        let invited = false

        const uid = userMail.toLowerCase().replace(/@.*/, "")
        const alreadyInvited = gmcdBot.client.getRoom(roomId)?.getMembers().some(roomMember => {
            logger.debug(roomMember.userId.toLowerCase(), "vs", uid)
            return roomMember.userId.toLowerCase().includes(uid)
        })

        if (alreadyInvited) {
            message = opts.logAlreadyInvited ? " 🤷 " + userMail + " était déjà présent ou a déjà été invité.\n" : ""
            logger.notice(userMail + "already in the room")
            invited = true
        }

        let hasError = false;

        let tries = 0
        while (!invited && tries <= opts.retries) {
            await gmcdBot.client.inviteByEmail(roomId, userMail)
                .then(() => {
                    logger.notice(userMail + " successfully invited.")
                    invited = true
                    message = " ✅ " + userMail + " invité.\n"
                })
                .catch(reason => {
                    if (reason.data?.error?.includes("already in the room")) {
                        opts.logAlreadyInvited ? message = " 🤷 " + userMail + " était déjà présent.\n" : ""
                        invited = true
                    } else {
                        logger.debug("typeof reason :", typeof reason, reason?.HTTPError, reason?.httpStatus)
                        logger.error("Error inviting " + userMail + " will retry in 10 seconds", reason)
                        if (tries == opts.retries) {

                            if (reason?.httpStatus === '502') {
                                message = " ❗️ " + userMail + ", Tchap returned 502...\n"
                            } else {
                                message = " ❗️ " + userMail + ", " + (reason?.data?.error) + "\n"
                                hasError = true
                            }
                        }
                    }
                })
            tries++
            if (!invited && tries <= opts.retries) await new Promise(res => setTimeout(res, 10 * 1000));
        }

        return {message, hasError};
    },

    async createRoom(roomName: string, isPrivate: boolean = true) {

        logger.debug("createRoom", roomName, isPrivate)

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
                visibility: isPrivate ? Visibility.Private : Visibility.Public,
                // preset: isPrivate ? Preset.PrivateChat : Preset.PublicChat,
                // power_level_content_override: {
                // users_default: 50
                // },
            })
                .then((data) => {
                    logger.notice("Room created : ", data)
                    message += roomName + " a été créé. ✌️\n"
                    message += isPrivate ? "Ce salon est privé, à ce titre il est crypté.\n" : ""
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
            sendMessage(gmcdBot.client, roomId, message)
        }

        return {roomId, message}
    },

    async deleteRoom(roomId: string, opts: { kickReason?: "Quelqu'un m'a demandé de vous expulser, désole 🤷", client?: MatrixClient, }) {

        logger.debug("deleteRoom", roomId)

        if (!opts.client) opts.client = gmcdBot.client
        const client = opts.client
        const botId = client.getUserId()

        if (!botId) throw ("deleteRoom : Bot id should not be null !")

        await getPowerLevel(client, roomId, botId).then(powerLevel => {
            if (powerLevel < 100) {
                throw ("Oups ! Désolé, je dois être administrateur afin de supprimer un salon")
            }
        })

        let adminList: { name: string, userId: string }[] = []

        let members: RoomMember[] | undefined = gmcdBot.client.getRoom(roomId)?.getMembers();

        if (members) {
            for (const roomMember of members) {
                await this.kickUser(roomId, roomMember.userId, opts.kickReason)
                if (roomMember.powerLevel === 100) adminList.push({name: roomMember.name, userId: roomMember.userId})
            }
        }

        if (adminList.length > 0) sendMessage(client, roomId, "Quelques Administrateurs demeurent dans ce salon et je ne peux les exclure.\nCe salon ne sera pas purgé tant qu'ils ne l'auront pas quitté.\nN'oubliez pas d'éteindre la lumière en partant ! 💡\n 👋")
        else sendMessage(client, roomId, "🚪")

        client.leave(roomId)

        return adminList
    },

    async kickUser(roomId: string, userId: string, kickReason?: "Quelqu'un m'a demandé de vous expulser, désole 🤷") {

        let message = ""
        let isAdmin = false
        let hasError = false
        let members: RoomMember[] | undefined = gmcdBot.client.getRoom(roomId)?.getMembers();

        if (!members) return {message: "No room members found !", isAdmin: false, hasError: true}

        for (const roomMember of members) {

            if (!roomMember.userId.toLowerCase().includes(userId.toLowerCase())) continue
            if (roomMember.userId === gmcdBot.client.getUserId()) {
                message += "Did you really thought i would kick myself ?!\n"
                continue
            }

            logger.debug("roomMember", roomMember)
            logger.debug(roomMember.userId + " power level  = " + roomMember.powerLevel)

            if (!roomMember.powerLevel || roomMember.powerLevel < 100) {

                logger.debug("Kicking " + roomMember.userId)
                await gmcdBot.client.kick(roomId, roomMember.userId, kickReason)
                    .then(() => {
                        message += roomMember.name + " kicked.\n"
                    })
                    .catch(reason => {
                        hasError = true
                        logger.error("Error kicking " + roomMember.name, reason)
                    })
            } else {
                isAdmin = true
                hasError = true
                message += "Cannot kick admin " + roomMember.name + ".\n"
            }
        }

        if (message === "") message = "Found no matching member to kick."

        return {message, isAdmin, hasError}

    },

    async getRoomName(roomId: string) {

        logger.debug("getRoomName", roomId)

        const roomName = gmcdBot.client.getRoom(roomId)?.name

        if (!roomName) throw "Cannot find room name for Id : " + roomId + ". Do I know this room ?"

        return roomName
    },

    async inviteUsersInRoom(userList: string[], roomId: string, retry = 0, logAlreadyInvited = true): Promise<void> {

        logger.debug("inviteUsersInRoom", userList.length, roomId, retry, logAlreadyInvited)

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
                }).catch(_ => {
                    logger.notice("access_rules is not allowed in this context (Public room)")
                })
        }

        // Maj du token préventivement afin d’éviter de multiples appels en parallèle
        await gmcdBot.getIdentityServerToken()

        // On invite par groupes de 10 et on met un délai entre les invitations pour ne pas tomber sur la limite des haproxy (rate limit de l’endpoint en lui-même = 1k/s).
        let tasks: Promise<{ message: string, hasError: boolean, mail: string }>[] = [];
        let count = 0
        let mailInErrorList: string[] = []

        for (const mail of userMailList) {

            tasks.push(
                new Promise<{ message: string, hasError: boolean, mail: string }>(async (resolve) => {
                    const delay = rateLimitDelay * count
                    logger.debug("inviteUserInRoom " + mail + " in " + delay + "ms")
                    await new Promise(resolve => setTimeout(resolve, delay));
                    let inviteResult = {message: "", hasError: false, mail: ""}
                    await this.inviteUserInRoom(mail, roomId, {retries: 0, logAlreadyInvited: logAlreadyInvited})
                        .then(value => {
                            inviteResult = {message: value.message, hasError: value.hasError, mail: mail}
                        })
                    resolve(inviteResult)
                })
            )

            count++
        }

        sendMessage(gmcdBot.client, roomId, message)

        logger.debug("Awaiting " + tasks.length + " inviting tasks.")

        splitEvery(10, tasks).map(async (chunk) => {
            let inviteResultMessage = ""
            await Promise.all(chunk).then(results => {
                for (const result of results) {
                    inviteResultMessage += result.message
                    if (result.hasError) mailInErrorList.push(result.mail)
                    logger.debug("inviteResult : ", result)
                }
            }).catch(reason => {
                logger.error("Promise.all(inviteByEmail) : ", reason)
                throw (reason)
            })
            sendMessage(gmcdBot.client, roomId, inviteResultMessage)
        })

        logger.debug("Inviting tasks completed")

        if (mailInErrorList.length > 0 && retry <= 2) {
            sendMessage(gmcdBot.client, roomId, " ❗️ Certaines invitations semblent en erreur et seront retentées dans 30 minutes.\n")
            setTimeout(() => {
                retry++
                this.inviteUsersInRoom(mailInErrorList, roomId, retry, false).catch(reason => {
                    throw reason
                })
            }, 30 * 60 * 1000)
        }
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

        logger.debug("isMemberOfRoom", roomId, userId)

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
