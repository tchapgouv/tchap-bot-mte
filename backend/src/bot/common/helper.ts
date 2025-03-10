import {EventType, MatrixClient, MatrixEvent, MsgType, RelationType, Room} from "matrix-js-sdk";
import logger from "../../utils/logger.js";
import {User} from "../classes/User.js";
import fs from "fs";
import showdown from "showdown";
import path from "path";
import {fileURLToPath} from "url";
import {ADMINS} from "./config.js";
import {Agent} from "../../services/ldap.service.js";

const converter = new showdown.Converter({simpleLineBreaks: true})

export function addEmoji(client: MatrixClient, event: MatrixEvent, emoji: string) {
    logger.debug("Sending emoji : ", emoji)

    const room = event.getRoomId()
    if (!room) {
        logger.error("Room id not found while sending emoji !")
        return
    }

    const content = {
        "m.relates_to": {
            "event_id": event.getId(), "key": emoji, "rel_type": RelationType.Annotation
        },
    };

    client.sendEvent(room, EventType.Reaction, content).then((res) => {
        logger.debug(res);
    }).catch(e => logger.error(e));
}

export async function sendMarkdownMessage(client: MatrixClient, roomId: string, message: string): Promise<void> {

    logger.debug("Converting markdown message.")

    const htmlMessage = converter.makeHtml(message)
    return sendHtmlMessage(client, roomId, message, htmlMessage)
}

export async function sendMessage(client: MatrixClient, room: string, message: string): Promise<void> {

    logger.debug("Sending message : ", message)
    logger.debug("room : ", room)

    const content = {
        "body": message,
        "msgtype": MsgType.Text
    };
    await client.sendEvent(room, EventType.RoomMessage, content).then((res) => {
        logger.debug(res);
    }).catch(reason => {
        logger.error(reason)
    });
}


export function extractHelpFromComments(commandes: { command: string | undefined, return: string, isAnswer: boolean, isAdmin: boolean }[], __dirname: string, file: string) {
    if (/.*\.js/i.test(file)) {
        try {
            const data = fs.readFileSync(__dirname + "/" + file, 'utf8');

            const regexCommand: RegExp = /[\s\S]* \* @help.*(?:\n \* .*)*\n \* command *: *(.*)/i
            const regexReturn: RegExp = /[\s\S]* \* @help.*(?:\n \* .*)*\n \* return *: *(.*)/i
            const regexIsAnswer: RegExp = /[\s\S]* \* @help.*(?:\n \* .*)*\n \* isAnswer *: *(.*)/i
            const regexIsAdmin: RegExp = /[\s\S]* \* @help.*(?:\n \* .*)*\n \* isAdmin *: *(.*)/i

            const matchCommand = data.match(regexCommand)?.at(1)
            const matchReturn = data.match(regexReturn)?.at(1)
            const matchIsAnswer = data.match(regexIsAnswer)?.at(1)
            const matchIsAdmin = data.match(regexIsAdmin)?.at(1)

            if (!matchReturn) return commandes;

            const command = {
                command: matchCommand,
                return: matchReturn,
                isAnswer: matchIsAnswer ? matchIsAnswer === 'true' : false,
                isAdmin: matchIsAdmin ? matchIsAdmin === 'true' : false
            }

            commandes.push(command)
        } catch (err) {
            logger.error(err);
        }
    }
    return commandes
}

/**
 * https://spec.matrix.org/v1.10/client-server-api/#mfile
 */
export async function sendFile(client: MatrixClient, room: string, file: { fileName: string, mimeType: string, url: string, size: number }) {

    logger.debug("Sending file : ", room, file)

    const content = {
        "body": file.fileName,        //	string	Required: A human-readable description of the file. This is recommended to be the filename of the original upload.
        // "file":,                   //	EncryptedFile	Required if the file is encrypted. Information on the encrypted file, as specified in End-to-end encryption.
        "filename": file.fileName,    //	string	The original filename of the uploaded file.
        "info":                       //	FileInfo	Information about the file referred to in url.
            {
                "mimetype": file.mimeType,         // string	The mimetype of the file e.g. application/msword.
                "size": file.size,                 // integer	The size of the file in bytes.
            },
        "msgtype": MsgType.File,      //	string	Required:  One of: [m.file].
        "url": file.url               //	string	Required if the file is unencrypted. The URL (typically mxc:// URI) to the file.
    };
    await client.sendEvent(room, EventType.RoomMessage, content).then((res) => {
        logger.debug(res);
    }).catch(reason => {
        logger.error(reason)
    });
}

/**
 * https://spec.matrix.org/v1.10/client-server-api/#mimage
 */
export async function sendImage(client: MatrixClient, room: string, fileName: string, image: { mimeType: string, height: number, width: number, size: number }, url: string) {

    logger.debug("Sending image : ", room, image, url)

    const content = {
        "body": fileName,  // string	Required: A textual representation of the image. This could be the alt text of the image, the filename of the image, or some kind of content description for accessibility e.g. ‘image attachment’.
        // "file":,                  // EncryptedFile	Required if the file is encrypted. Information on the encrypted file, as specified in End-to-end encryption.
        "info": {
            "h": image.height,            // integer	The intended display height of the image in pixels. This may differ from the intrinsic dimensions of the image file.
            "mimetype": image.mimeType,   // string	The mimetype of the image, e.g. image/jpeg.
            "size": image.size,	          // integer	Size of the image in bytes.
            "w": image.width,	          // integer	The intended display width of the image in pixels. This may differ from the intrinsic dimensions of the image file.
            "xyz.amorgan.blurhash": "L6PZfSi_.AyE_3t7t7R**0o#DgR4"
        },                           // ImageInfo	Metadata about the image referred to in url.
        "msgtype": MsgType.Image,    // string	Required: One of: [m.image].
        "url": url,                  // string	Required if the file is unencrypted. The URL (typically mxc:// URI) to the image.
    };
    await client.sendEvent(room, EventType.RoomMessage, content).then((res) => {
        logger.debug(res);
    }).catch(reason => {
        logger.error(reason)
    });
}

export async function sendHtmlMessage(client: MatrixClient, room: string, rawMessage: string, htmlMessage: string): Promise<void> {

    logger.debug("Sending Html message : ", rawMessage)
    logger.debug("room : ", room)

    const content = {
        "body": rawMessage,
        "formatted_body": htmlMessage,
        "format": "org.matrix.custom.html",
        "msgtype": MsgType.Text
    };
    await client.sendEvent(room, EventType.RoomMessage, content).then((res) => {
        logger.debug(res);
    }).catch(reason => {
        logger.error(reason)
    });
}

export async function getUserPowerLevel(client: MatrixClient, event: MatrixEvent): Promise<User | null> {

    let user: User | undefined

    if (event?.sender?.name &&
        event?.sender?.userId &&
        event?.event?.room_id) {

        const roomId = event.event.room_id
        const userName = event.sender.name
        const userId = event.sender.userId

        await getPowerLevel(client, roomId, userId).then(userPowerLevel => {

            user = {
                id: userId,
                powerLevel: userPowerLevel,
                username: userName,
                isAdministrator: userPowerLevel > 99,
                isModerator: userPowerLevel > 49
            }
        })
    }

    if (!user) return null
    return user
}

export async function getPowerLevel(client: MatrixClient, roomId: string, userId: string = client.getUserId() + ""): Promise<number> {

    let userPowerLevel = 0
    await client.getStateEvent(roomId, "m.room.power_levels", "").then(record => {

        logger.debug("getPowerLevel record : ", record)

        userPowerLevel = record.users ? record.users[userId] : 0
    }).catch(reason => {
        logger.error("getPowerLevel record : ", reason)
        userPowerLevel = 0
    })

    return userPowerLevel
}


export async function isSomeoneAdmin(client: MatrixClient, roomId: string): Promise<boolean> {

    let someoneIsAdmin: boolean = false

    await client.getStateEvent(roomId, "m.room.power_levels", "").then(record => {

        logger.debug(record)

        for (const user in record.users) {
            if (/.*bot-gmcd.*/i.test(user)) continue
            const powerLevel = record.users[user]
            if (powerLevel > 99) someoneIsAdmin = true
        }
    })

    logger.debug("someoneIsAdmin = " + someoneIsAdmin)

    return someoneIsAdmin
}

function extractHelpFromCommand(commande: { command: string | undefined; return: string; isAnswer: boolean; isAdmin: boolean }, isAdmin: boolean) {
    let help = ""
    if (commande.isAdmin && !isAdmin) return help;
    help += " - "
    if (commande.command) {
        help += commande.isAnswer ? "Si on me dit " : "Si j'entends "
        help += "`" + commande.command + "`, "
    }
    help += commande.return + "  \n"
    return help;
}

export function redactHelp(commonCommandes: { command: string | undefined; return: string; isAnswer: boolean; isAdmin: boolean }[],
                           specificCommands: { command: string | undefined; return: string; isAnswer: boolean; isAdmin: boolean }[],
                           isAdmin: boolean): string {

    let help = "Voici une liste non exhaustive des commandes auxquelles je sais répondre (Si les droits du salon me le permettent).  \n\n"
    help += specificCommands.length > 0 ? "Commandes générales à tous les Bots :  \n" : ""
    for (const commande of commonCommandes) {
        help += extractHelpFromCommand(commande, isAdmin);
    }
    if (specificCommands.length > 0) {
        help += "\nCommandes qui me sont propres :  \n"
        for (const commande of specificCommands) {
            help += extractHelpFromCommand(commande, isAdmin);
        }
    }
    help += isAdmin ? "\n_<sup>*</sup> Administrateur uniquement_" : ""
    logger.notice(help)
    return help
}

export function generateHelp(dirname: string, isAdmin: boolean): string {

    let specificCommands: { command: string | undefined; return: string; isAnswer: boolean; isAdmin: boolean }[] = []

    let files

    if (dirname) {
        files = fs.readdirSync(dirname);
        for (const file of files) {
            specificCommands = extractHelpFromComments(specificCommands, dirname, file);
        }
    }

    specificCommands.sort((a, b) => {
        if (a.command && !b.command) return 1
        if (!a.command && b.command) return -1
        if (a.isAnswer && !b.isAnswer) return 1
        if (!a.isAnswer && b.isAnswer) return -1
        if (a.command && b.command) return a.command < b.command ? 1 : -1
        return a.return < b.return ? 1 : -1
    }).reverse()

    let commonCommands: { command: string | undefined; return: string; isAnswer: boolean; isAdmin: boolean }[] = []

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.resolve(__filename, "../scripts");
    files = fs.readdirSync(__dirname);

    for (const file of files) {
        commonCommands = extractHelpFromComments(commonCommands, __dirname, file);
    }

    commonCommands.sort((a, b) => {
        if (a.command && !b.command) return 1
        if (!a.command && b.command) return -1
        if (a.isAnswer && !b.isAnswer) return 1
        if (!a.isAnswer && b.isAnswer) return -1
        if (a.command && b.command) return a.command < b.command ? 1 : -1
        return a.return < b.return ? 1 : -1
    }).reverse()

    // logger.notice(commonCommands);

    return redactHelp(commonCommands, specificCommands, isAdmin)
}

export function isSupport(userId: string) {
    return ADMINS.some(admin => {
        return userId.includes(admin)
    })
}

export function mailFromRoomMember(username: string, userId: string): string {
    const userUID = username.replace(/(.*?) \[.*/, "$1").replaceAll(" ", ".").toLowerCase()
    const domain = userId.replace(/@(.*?)[0-1]*:.*/, "$1").replace(userUID + "-", "")
    return userUID + "@" + domain
}

export function fullDnFromAgent(agent: Agent): string {
    const root = agent.dn.replace(/.*ou=(.*?),ou=organisation.*/, "$1").replace("melanie", "MTEL")
    return root + "/" + agent.departmentNumber
}

export function getMatrixIdFromLdapAgent(agent: Agent, room: Room | null) {

    const roomMemberList = room?.getMembers()

    if (roomMemberList && roomMemberList.length > 0) {
        for (const roomMember of roomMemberList) {
            for (const mail of agent.mail) {
                if (roomMember.userId.toLowerCase().includes(mail.toLowerCase().replace("@", "-"))) return roomMember.userId
            }
        }
    }

    return "@" + agent.mailPR.toLowerCase().replace("@", "-") + ":agent.dev-durable.tchap.gouv.fr"
}

