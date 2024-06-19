import {EventType, MatrixClient, MatrixEvent, MsgType, RelationType} from "matrix-js-sdk";
import logger from "../../utils/logger.js";
import {User} from "../classes/User.js";
import fs from "fs";
import showdown from "showdown";
import path from "path";
import {fileURLToPath} from "url";
import {ADMINS} from "./config.js";

const converter = new showdown.Converter()

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


export function extractHelpFromComments(commandes: { command: string | undefined, return: string, isAnswer: boolean }[], __dirname: string, file: string) {
    if (/.*\.js/i.test(file)) {
        try {
            const data = fs.readFileSync(__dirname + "/" + file, 'utf8');

            const regexCommand: RegExp = /[\s\S]* \* @help.*(?:\n \* .*)*\n \* command *: *(.*)/i
            const regexReturn: RegExp = /[\s\S]* \* @help.*(?:\n \* .*)*\n \* return *: *(.*)/i
            const regexIsAnswer: RegExp = /[\s\S]* \* @help.*(?:\n \* .*)*\n \* isAnswer *: *(.*)/i

            const matchCommand = data.match(regexCommand)?.at(1)
            const matchReturn = data.match(regexReturn)?.at(1)
            const matchIsAnswer = data.match(regexIsAnswer)?.at(1)

            if (!matchReturn) return commandes;

            const command = {
                command: matchCommand,
                return: matchReturn,
                isAnswer: matchIsAnswer ? matchIsAnswer === 'true' : false
            }

            commandes.push(command)
        } catch (err) {
            logger.error(err);
        }
    }
    return commandes
}

export async function sendFile(client: MatrixClient, room: string, fileName: string, url: string) {

    logger.debug("Sending file : ", room, fileName, url)

    const content = {
        "body": fileName,        //	string	Required: A human-readable description of the file. This is recommended to be the filename of the original upload.
        // "file":,              //	EncryptedFile	Required if the file is encrypted. Information on the encrypted file, as specified in End-to-end encryption.
        "filename": fileName,    //	string	The original filename of the uploaded file.
        "info": "File attachment",      //	FileInfo	Information about the file referred to in url.
        "msgtype": MsgType.File, //	string	Required:  One of: [m.file].
        "url": url               //	string	Required if the file is unencrypted. The URL (typically mxc:// URI) to the file.
    };
    await client.sendEvent(room, EventType.RoomMessage, content).then((res) => {
        logger.debug(res);
    }).catch(reason => {
        logger.error(reason)
    });
}

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


export function redactHelp(commandes: { command: string | undefined; return: string; isAnswer: boolean }[]): string {

    let help = "Voici une liste non exhaustive des commandes auxquelles je sais répondre (Si les droits du salon me le permettent) :\n"
    for (const commande of commandes) {
        help += " - "
        if (commande.command) {
            help += commande.isAnswer ? "Si on me dit " : "Si j'entends "
            help += "`" + commande.command + "`, "
        }
        help += commande.return + "\n"
    }
    logger.notice(help)
    return help
}

export function generateHelp(dirname?: string): string {

    let commands: { command: string | undefined; return: string; isAnswer: boolean }[] = []

    let files

    if (dirname) {
        files = fs.readdirSync(dirname);
        for (const file of files) {
            commands = extractHelpFromComments(commands, dirname, file);
        }
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.resolve(__filename, "../scripts");
    files = fs.readdirSync(__dirname);

    for (const file of files) {
        commands = extractHelpFromComments(commands, __dirname, file);
    }

    commands.sort((a, b) => {
        if (a.command && !b.command) return 1
        if (!a.command && b.command) return -1
        if (a.isAnswer && !b.isAnswer) return 1
        if (!a.isAnswer && b.isAnswer) return -1
        if (a.command && b.command) return a.command < b.command ? 1 : -1
        return a.return < b.return ? 1 : -1
    }).reverse()

    // logger.notice(commands);

    return redactHelp(commands)
}

export function answerHelp(body: string, event: MatrixEvent, client: MatrixClient, help: string) {
    const regex: RegExp = /.*(help|aide).*/i

    if (regex.test(body)) {

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            const roomId = event.event.room_id

            sendMarkdownMessage(client, roomId, help)

            return true
        }
    }

    return false
}

export function isSupport(userId: string) {
    return ADMINS.some(admin => {
        return userId.includes(admin)
    })
}
