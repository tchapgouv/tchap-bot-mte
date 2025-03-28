import botGmcd from "../bot/gmcd/bot.js";
import gmcdBotConfig from "../bot/gmcd/config.js";
import botPsin from "../bot/psin/bot.js";
import bot777 from "../bot/777/bot.js";
import vm from "vm"
import {IContent, MatrixClient, Method, Preset, Visibility} from "matrix-js-sdk";
import logger from "../utils/logger.js";
import ldapService, {Agent} from "./ldap.service.js";
import {getPowerLevel, sendFile, sendHtmlMessage, sendImage, sendMarkdownMessage, sendMessage} from "../bot/common/helper.js";
import {Bot} from "../bot/common/Bot.js";
import {splitEvery} from "../utils/utils.js";
import {RoomMember} from "matrix-js-sdk/lib/models/room-member.js";
import ldap from "ldapjs";
import ldapGroupService from "./ldapListGroup.service.js";
import mailGroupService from "./mailListGroup.service.js";
import metricService, {MetricLabel} from "./metric.service.js";

const bots: Bot[] = [
    botGmcd,
    botPsin,
    bot777
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

    async getHistorySinceMilliseconds(roomId: string, opts: { botId?: string, since: number }) {
        const limit = Number.parseInt(process.env.HISTORY_FETCH_MESSAGES_LIMIT + '') || 20

        logger.debug("getHistory SinceMilliseconds : search with limit = " + limit + ", since = " + opts.since)

        let gotAll = false
        let events: ChunkElement[] = []
        let from
        while (!gotAll) {
            logger.debug("getHistory SinceMilliseconds : from = " + from)
            await this.getlastNthMessages(roomId, {nth: limit, botId: opts.botId, from}).then(data => {
                for (const chunkElement of data.chunk) {
                    if (chunkElement.age < opts.since) {
                        events.push(chunkElement)
                    } else {
                        gotAll = true
                    }
                }
                from = data.end
            })
        }
        logger.debug("getHistory SinceMilliseconds : found " + events.length)
        return events
    },

    async getlastNthMessages(roomId: string, opts: { nth: number, botId?: string, from?: string }) {

        const bot = this.getBotById(opts.botId || process.env.BOT_USER_ID + "")

        const filter = {'lazy_load_members': 'true', 'types': ['m.room.message']}
        const order = "b" // 'f'orward || 'b'ackward
        const url = "/rooms/" + roomId + "/messages?" +
            "dir=" + order +
            "&limit=" + opts.nth +
            (opts.from ? "&from=" + opts.from : '') +
            "&filter=" + encodeURI(JSON.stringify(filter))

        logger.debug("getHistory lastNthMessages : requesting last " + opts.nth + " messages from " + roomId + " starting at " + opts.from)
        logger.debug("getHistory lastNthMessages : url = " + url)


        return await bot.client.http.authedRequest<{
            "chunk": ChunkElement[],
            end: string
        }>(Method.Get, url)
            .then(data => {
                // for (const chunkElement of data.chunk) {
                //     if (chunkElement.content.body) {
                //         console.log(chunkElement.content.body)
                //     }
                // }
                logger.debug("getHistory lastNthMessages : got = " + data.chunk.length)
                return {chunk: data.chunk, end: data.end}
            })
    },

    async inviteUserInRoom(userMail: string, roomId: string, opts = {retries: 0, logAlreadyInvited: true}) {

        userMail = userMail.toLowerCase()

        logger.debug("inviteUserInRoom", userMail, roomId, opts)

        let message = ""

        const roomName = await this.getRoomName(roomId)

        if (!userMail) return {message, hasError: true}

        logger.notice("Inviting " + userMail + " into " + roomName + " (" + roomId + "). retries " + opts.retries)
        let invited = false

        const uid = userMail.replace(/@.*/, "")
        const alreadyInvited = botGmcd.client.getRoom(roomId)?.getMembers().some(roomMember => {
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

            const userInternalIdLeftPart = "@" + userMail.toLowerCase().replace("@", "-")
            const userInternalId = userInternalIdLeftPart + ":agent.dev-durable.tchap.gouv.fr"
            const user = botGmcd.client.getUser(userInternalId)

            let inviteRequest, userToLog: string, userToMarkdown: string
            if (user !== null) {
                inviteRequest = botGmcd.client.invite(roomId, userInternalId)
                userToLog = userInternalIdLeftPart
                userToMarkdown = `[${userToLog}](https://matrix.to/#/${userInternalId})`
            } else {
                inviteRequest = botGmcd.client.inviteByEmail(roomId, userMail.toLowerCase())
                userToLog = userMail.toLowerCase()
                userToMarkdown = userMail.toLowerCase()
            }

            await inviteRequest
                .then(() => {
                    logger.notice(userToLog + " successfully invited.")
                    message = " ✅ " + userToMarkdown + " invité.\n"
                    invited = true
                })
                .catch(reason => {
                    if (reason.data?.error?.includes("already in the room")) {
                        opts.logAlreadyInvited ? message = " 🤷 " + userToMarkdown + " était déjà présent.\n" : ""
                        invited = true
                    } else {
                        logger.debug("typeof reason :", typeof reason, reason?.HTTPError, reason?.httpStatus)
                        logger.error("Error inviting " + userToLog + " will retry in 10 seconds", reason)
                        if (tries == opts.retries) {

                            if (reason?.httpStatus === '502') {
                                message = " ❗️ " + userToLog + ", Tchap returned 502...\n"
                            } else {
                                message = " ❗️ " + userToLog + ", " + (reason?.data?.error) + "\n"
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
        let roomId: string | undefined

        await botGmcd.client.getRoomIdForAlias("#" + roomName + ":" + process.env.TCHAP_SERVER_NAME).then((data) => {
            roomId = data.room_id
            message += roomName + " existait déjà et n'a pas été créé.\n"
        }).catch(reason => logger.notice("Room not found", reason))

        if (!roomId) {
            await botGmcd.client.createRoom({
                name: roomName,
                room_alias_name: roomName,
                preset: isPrivate ? Preset.PrivateChat : Preset.PublicChat,
                visibility: isPrivate ? Visibility.Private : Visibility.Public,
                power_level_content_override: {}
            })
                .then((data) => {
                    logger.notice("Room created : ", data)
                    message += roomName + " a été créé. ✌️\n"
                    message += isPrivate ? "Ce salon est privé, à ce titre il est crypté.\n" : ""
                    message += "Vous pouvez vous promouvoir administrateur simplement en me le demandant : `@bot-gmcd promote me`. 🍄\n"
                    message += "Enfin, vous pouvez me renvoyer : `@bot-gmcd oust !`. 🪦\n"
                    roomId = data.room_id

                    this.setRoomNotificationPowerLevel(roomId, 0)

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
            sendMessage(botGmcd.client, roomId, message)
        }

        return {roomId, message}
    },

    async upload(roomId: string, file: Buffer | string, opts: {
        client?: MatrixClient,
        fileName: string,
        mimeType: string,
        includeFilename?: boolean,
        width?: number,
        height?: number
    }) {

        let message = ""
        let uri = ""

        const client = opts.client || botGmcd.client

        await client.uploadContent(file, {name: opts.fileName, type: opts.mimeType, includeFilename: opts.includeFilename}).then(value => {

            if (opts.mimeType.includes("image")) {
                sendImage(
                    client,
                    roomId,
                    opts.fileName,
                    {
                        mimeType: opts.mimeType,
                        width: opts.width ? opts.width : 800,
                        height: opts.height ? opts.height : 600,
                        size: (typeof file === 'string') ? Buffer.byteLength(file, 'utf8') : file.byteLength,
                    },
                    value.content_uri)
            } else {
                sendFile(client,
                    roomId,
                    {
                        fileName: opts.fileName,
                        mimeType: opts.mimeType,
                        size: (typeof file === 'string') ? Buffer.byteLength(file, 'utf8') : file.byteLength,
                        url: value.content_uri
                    })
            }

            message = "File " + opts.fileName + " uploaded"
            uri = value.content_uri

        }).catch(reason => {
            logger.error("Error uploading file :", reason)
            message = "Error uploading file !"
        })

        return {message: message, uri: uri}
    },

    /**
     * @deprecated will be removed
     */
    setRoomNotificationPowerLevel(roomId: string, powerLevel: number) {

        logger.notice("Setting room notification power level requirement to " + powerLevel)

        botGmcd.client.getStateEvent(roomId, "m.room.power_levels", "").then(value => {
            logger.notice(value)
        }).catch(reason => {
            logger.error("Error getting room notification power level requirement :", reason)
        })
    },

    async deleteRoom(roomId: string, opts: { kickReason?: "Quelqu'un m'a demandé de vous expulser, désolé 🤷", client?: MatrixClient, }) {

        logger.debug("deleteRoom", roomId)

        if (!opts.client) opts.client = botGmcd.client
        const client = opts.client
        const botId = client.getUserId()

        if (!botId) throw ("deleteRoom : Bot id should not be null !")

        await getPowerLevel(client, roomId, botId).then(powerLevel => {
            if (powerLevel < 100) {
                throw ("Oups ! Désolé, je dois être administrateur afin de supprimer un salon")
            }
        })

        let adminList: { name: string, userId: string }[] = []

        let members: RoomMember[] | undefined = client.getRoom(roomId)?.getMembers();

        if (members) {
            for (const roomMember of members) {
                if (roomMember.userId === botId) continue
                await this.kickUser(roomId, roomMember.userId, opts.kickReason)
                if (roomMember.powerLevel === 100) adminList.push({name: roomMember.name, userId: roomMember.userId})
            }
        }

        if (adminList.length > 0) sendMessage(client, roomId, "Quelques Administrateurs demeurent dans ce salon et je ne peux les exclure.\nCe salon ne sera pas purgé tant qu'ils ne l'auront pas quitté.\nN'oubliez pas d'éteindre la lumière en partant ! 💡\n 👋")
        else sendMessage(client, roomId, "👋🚪")

        client.leave(roomId).then(() => {
            logger.notice("Room " + roomId + " successfully left.")
        }).catch((error) => {
            logger.error("Error leaving room " + roomId + " : " + error)
            metricService.createOrIncrease({
                name: "error",
                labels: [new MetricLabel("reason", "Error leaving room")]
            })
        })

        return adminList
    },

    async searchUserFromMail(userMail: string) {

        userMail = "@" + userMail.replace("@", "-")
        return this.searchUser(userMail).catch(reason => {
            throw reason
        })
    },

    async searchUser(searchTerm: string) {

        let user: { user_id: string, display_name?: string, avatar_url?: string } | undefined

        await botGmcd.client.searchUserDirectory({term: searchTerm, limit: 5}).then(value => {
            if (value.results.length > 1) throw 'Invalid number of matches (Limit 5). Found ' + value.results.length + ', expected 1.'
            if (value.results.at(0)) user = value.results.at(0)
        })

        if (!user) {
            const matchingKnownUsers = botGmcd.client.getUsers().filter(value => {
                return value.userId.toLowerCase().includes(searchTerm) || value.displayName?.toLowerCase().includes(searchTerm)
            })
            if (matchingKnownUsers.length > 1) throw 'Invalid number of matches (Limit 5). Found ' + matchingKnownUsers.length + ', expected 1.'
            const matchingKnownUser = matchingKnownUsers.at(0)
            if (matchingKnownUser) user = {user_id: matchingKnownUser.userId, display_name: matchingKnownUser.displayName, avatar_url: matchingKnownUser.avatarUrl}
        }

        if (!user) throw 'User not found.'

        return user
    },

    async kickUser(roomId: string, userTerm: string, kickReason: string = "Quelqu'un m'a demandé de vous expulser, désolé 🤷") {

        logger.debug("kickUser : ", roomId, userTerm, kickReason)

        let message = ""
        let isAdmin = false
        let hasError = false
        let members: RoomMember[] | undefined = botGmcd.client.getRoom(roomId)?.getMembers();

        if (!members || !members.length) return {message: "No room members found !", isAdmin: false, hasError: true}

        let powerLevel
        await getPowerLevel(botGmcd.client, roomId).then(value => {
            powerLevel = value
        })
        if (powerLevel !== 100) return {message: "Rights insufficient to kick !", isAdmin: false, hasError: true}

        for (const roomMember of members) {

            logger.debug("roomMember", roomMember)
            logger.debug(roomMember.userId + " power level  = " + roomMember.powerLevel)
            const isMatch = roomMember.userId.toLowerCase().includes(userTerm.toLowerCase())
            logger.debug(roomMember.userId.toLowerCase() + " vs " + userTerm.toLowerCase() + ". isMatch ? " + isMatch)

            if (!isMatch) continue

            if (roomMember.userId === botGmcd.client.getUserId()) {
                message += "Did you really thought i would kick myself ?!\n"
                continue
            }

            if (!roomMember.powerLevel || roomMember.powerLevel < 100) {

                logger.debug("Kicking " + roomMember.userId)

                await botGmcd.client.kick(roomId, roomMember.userId, kickReason)
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

        const roomName = botGmcd.client.getRoom(roomId)?.name

        if (!roomName) throw "Cannot find room name for Id : " + roomId + ". Do I know this room ?"

        return roomName
    },

    async inviteUsersInRoom(botId: string, userUidList: string[], roomId: string, retry = 0, logAlreadyInvited = true): Promise<void> {

        const bot = this.getBotById(botId)
        const client: MatrixClient = bot.client

        logger.debug("inviteUsersInRoom", userUidList.length, roomId, retry, logAlreadyInvited)

        const isMemberOfRoom = await this.isMemberOfRoom(roomId)

        if (!isMemberOfRoom) throw "I am not able to invite has i am not a member of the room !"

        if (!client.getRoom(roomId)?.canInvite(gmcdBotConfig.userId)) throw "I am do not have permissions to invite in this room !"

        let message: string = "Rapport d'invitations : \n"

        let userMailList: string[] = []
        let hasExternal = false

        await ldapService.getMailsForUIDs(userUidList)
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
            await client.sendStateEvent(roomId, "im.vector.room.access_rules", {rule: "unrestricted"})
                .then(() => {
                    logger.notice("Guest access set for room " + roomId)
                }).catch(_ => {
                    logger.notice("access_rules is not allowed in this context (Public room)")
                })
        }

        // Maj du token préventivement afin d’éviter de multiples appels en parallèle
        await bot.getIdentityServerToken()

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

        sendMessage(client, roomId, message)

        logger.debug("Awaiting " + tasks.length + " inviting tasks.")

        splitEvery(10, tasks).map(async (chunk) => {
            let inviteResultMessage = ""
            await Promise.all(chunk).then(results => {
                for (const result of results) {
                    inviteResultMessage += "-" + result.message
                    if (result.hasError) mailInErrorList.push(result.mail)
                    logger.debug("inviteResult : ", result)
                }
            }).catch(reason => {
                logger.error("Promise.all(inviteByEmail) : ", reason)
                throw (reason)
            })
            sendMarkdownMessage(client, roomId, inviteResultMessage)
        })

        logger.debug("Inviting tasks completed")

        if (mailInErrorList.length > 0 && retry <= 2) {
            sendMessage(client, roomId, " ❗️ Certaines invitations semblent en erreur et seront retentées dans 30 minutes.\n")
            setTimeout(() => {
                retry++
                this.inviteUsersInRoom(botId, mailInErrorList, roomId, retry, false).catch(reason => {
                    throw reason
                })
            }, 30 * 60 * 1000)
        }
    },

    getBotById(botId: string) {

        for (const bot of bots) {
            if (bot.client.getUserId() === botId) return bot
        }

        return botGmcd;
    },

    async postMessage(roomId: string,
                      message: { formattedMessage: string; rawMessage: string | undefined },
                      botId: string,
                      opts: { messageFormat: string } = {messageFormat: "text"}): Promise<{ message: string } | void> {

        let client = this.getBotById(botId).client;

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

        await botGmcd.client.getJoinedRoomMembers(roomId)
            .then(value => {
                isMember = !!value.joined[userId ? userId : "" + process.env.BOT_USER_ID]
            })
            .catch(reason => {
                logger.error("isMemberOfRoom", reason)
                isMember = false
            })

        return isMember
    },

    async isBotAMemberOfRoom(roomId: string | null, botId: string) {

        logger.debug("isBotAMemberOfRoom", roomId, botId)

        if (!roomId) throw "isBotAMemberOfRoom ? roomId cannot be empty"

        let isMember = false

        const bot = this.getBotById(botId);

        await bot.client.getJoinedRoomMembers(roomId)
            .then(value => {
                isMember = !!value.joined[botId]
            })
            .catch(reason => {
                logger.error("isMemberOfRoom", reason)
                isMember = false
            })

        return isMember
    },

    async updateRoomMemberList(client: MatrixClient, roomId: string, dryRun: boolean = true) {

        let dryRunMessage: string = "Les changements suivants seront opérés <sup>*</sup> : \n\n"

        if (!roomId) throw "updateRoomMemberList : roomId cannot be empty"

        const ldapListGroup = await ldapGroupService.findRoomGroup(roomId)
        const mailListGroup = await mailGroupService.findRoomGroup(roomId)

        logger.debug("ldapListGroup :", ldapListGroup)
        logger.debug("mailListGroup :", mailListGroup)

        if (!ldapListGroup && !mailListGroup) {
            throw ({message: "No defined ldap group or mail group configuration found for given room."})
        }

        let agentList: Agent[] = []

        const ldapClient = ldap.createClient({url: process.env.LDAP_URI || ''});

        if (ldapListGroup) {
            agentList = await ldapService.getUsersWithLdapRequest(ldapClient, ldapListGroup.getDataValue("base_dn"), ldapListGroup.getDataValue("recursively"), ldapListGroup.getDataValue("filter"))
        }
        if (mailListGroup) {
            agentList = await ldapService.getUsersWithLdapMailingList(ldapClient, mailListGroup.getDataValue("mail"))
        }

        const roomMembers: RoomMember[] = client.getRoom(roomId)?.getMembers() || [];

        let foundSomeoneToKick = false
        for (const roomMember of roomMembers) {
            if (!agentList.some(agent => roomMember.userId.includes(agent.mailPR.toLowerCase().replace("@", "-")))) {
                if (roomMember.userId.toLowerCase().includes("bot-")) continue
                if (dryRun) {
                    if (!foundSomeoneToKick) {
                        foundSomeoneToKick = true
                        dryRunMessage += "Seront renvoyés :\n\n"
                    }
                    dryRunMessage += " - " + roomMember.name + "\n"
                } else {
                    this.kickUser(roomId, roomMember.userId, "Vous n'appartenez plus au groupe configuré, définissant les membres de ce salon.").then(value => {
                        sendMessage(client, roomId, value.message)
                    })
                }
            }
        }

        let userUidList: string[] = []
        let foundSomeoneToInvite = false
        for (const agent of agentList) {

            const mailPR = agent.mailPR.toLowerCase()

            if (!roomMembers.some(roomMember => roomMember.userId.includes(agent.mailPR.toLowerCase().replace("@", "-")))) {
                if (dryRun) {
                    if (!foundSomeoneToInvite) {
                        foundSomeoneToInvite = true
                        dryRunMessage += "\nSeront invités :\n\n"
                    }
                    dryRunMessage += " - " + mailPR + "\n"
                } else {
                    userUidList.push((agent.uid || "").toLowerCase())
                }
            }
        }

        if (dryRun) {
            if (!foundSomeoneToInvite && !foundSomeoneToKick) {
                dryRunMessage += "Aucun.\n"
            }
            dryRunMessage += "\n_<sup>*</sup> Sous réserve de droits suffisants._"
            sendMarkdownMessage(client, roomId, dryRunMessage)
        } else {
            if (userUidList.length > 0) {
                this.inviteUsersInRoom(client.getUserId() + "", userUidList, roomId, 0, false).catch(reason => {
                    logger.error("Error inviting users based on ldap", reason)
                })
            }
        }
    }
}

export interface ChunkElement {

    content: IContent
    origin_server_ts: number
    room_id: string
    sender: string
    type: string
    // unsigned:
    event_id: string
    user_id: string
    age: number
}
