import logger from "../../utils/logger.js";
import * as sdk from "matrix-js-sdk";
import {ClientEvent, EventType, RoomEvent, RoomMemberEvent} from "matrix-js-sdk";
import {GMCD_INFRA_ROOM_ID, myAccessToken, myBaseUrl, myDeviceId, myIdBaseUrl, myUserId} from "./config.js";
import {sendMessage} from "./helper.js";
import {parseMessage, parseMessageToSelf} from "./answer.js";
import bot from "./bot.js";
import {RequestInit} from "node-fetch";
import fetchWithError from "../../utils/fetchWithError.js";

let ids_token: { token: string, valid_until: Date } | undefined

const opts = {
    baseUrl: myBaseUrl,
    accessToken: myAccessToken,
    userId: myUserId,
    deviceId: myDeviceId,
    idBaseUrl: myIdBaseUrl,
    identityServer: {
        getAccessToken(): Promise<string | null> {
            return getIdentityServerToken()
        }
    }
}

function isTokenValidForTheNextNthMinutes(ids_token: { token: string, valid_until: Date }, minutes: number) {
    logger.debug("is " + ids_token.valid_until.getTime() + " > " + ((new Date()).getTime() + (minutes * 60 * 1000)) + " ?")
    return ids_token.valid_until.getTime() > ((new Date()).getTime() + (minutes * 60 * 1000))
}

export async function getIdentityServerToken(): Promise<string | null> {

    return new Promise((resolve, _reject) => {

        if (ids_token?.token && isTokenValidForTheNextNthMinutes(ids_token, 5)) {
            logger.notice("Token still valid : ", ids_token)
            resolve(ids_token.token)
            return
        }

        bot.getOpenIdToken().then(openIdToken => {
            logger.notice("openIdToken : ", openIdToken)
            const url: string = process.env.IDENTITY_SERVER_URL + "/_matrix/identity/v2/account/register"
            const requestInit: RequestInit = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(openIdToken)
            }
            const fetchOpts = {
                requestInit: requestInit,
                proxify: true,
                timeout: 15000
            }
            fetchWithError(url, fetchOpts)
                .then((response: Response) => response.json())
                .then((data: any) => {
                    logger.notice("fetch : " + url, data)
                    ids_token = {
                        token: data.access_token,
                        valid_until: new Date((new Date()).getTime() + (60 * 60 * 1000))
                    }
                    resolve(data.access_token)
                })
                .catch(reason => logger.error("fetch : " + url, reason))

        }).catch(reason => {
            logger.error("getOpenIdToken : ", reason)
            resolve(null)
        })

    })
}

const client = sdk.createClient(opts);

client.usingExternalCrypto = true

client.on(ClientEvent.Sync, async function (state, _prevState, _res) {
    if (state === "PREPARED") {
        onPrepared()
    } else {
        // logger.debug(state);
    }
});

// Listen for low-level MatrixEvents
client.on(ClientEvent.Event, function (event) {
    logger.debug(event.getType());
});

// Listen for typing changes
client.on(RoomMemberEvent.Typing, function (event, member) {
    if (member.typing) {
        logger.debug(member.name + " is typing...");
    } else {
        logger.debug(member.name + " stopped typing.");
    }
});

// Auto join rooms
client.on(RoomMemberEvent.Membership, function (event, member) {
    if (member.membership === "invite" && member.userId === myUserId) {
        client.joinRoom(member.roomId).then(function () {
            logger.notice("Auto-joined %s", member.roomId);
            // sendMessage(client, member.roomId, "Bonjour, merci pour l'invitation ! 🎆")
        });
    }
});

// Listen to messages
client.on(RoomEvent.Timeline, function (event, _room, _toStartOfTimeline) {
    logger.debug("-------------------------------------------------------")
    logger.debug("Event type : ", event.getType())
    logger.debug("Event :", event);
    logger.debug("Event content :", event.event.content)

    if (event.getType() === EventType.RoomMessage) {

        if (event.sender?.userId === myUserId) {
            logger.info("Message is mine")
            return
        }

        const userIds = event.getContent()["m.mentions"]?.user_ids;

        const isSelfMentioned = userIds && userIds.indexOf(myUserId) > -1;
        logger.debug("Is self mentioned ? ", isSelfMentioned)
        logger.debug("sender = ", event.getSender())
        logger.debug("event.event.unsigned = ", event.event.unsigned)
        logger.debug("event age = ", event.event.unsigned?.age)
        const isNewMessage = event.event.unsigned?.age && event.event.unsigned.age < 10 * 1000
        logger.debug("isNewMessage ? ", isNewMessage)

        if (isNewMessage) {

            if (isSelfMentioned) {
                parseMessageToSelf(client, event)
            } else {
                parseMessage(client, event)
            }
        }
    }
});


function onPrepared() {
    logger.debug("prepared");

    client.publicRooms().then((data) => {
        logger.debug("Public Rooms: %s", JSON.stringify(data));
    }).catch(e => logger.error(e))

    const start = ['Bonjour à tous', 'Bonjour', 'Salut', 'Hello'];
    const startLength = start.length
    const end = ['.', ' !', ', me revoilà.', '. Je viens de redémarrer ¯\\_(ツ)_/¯', ', encore =)'];
    const endLength = end.length

    sendMessage(client, GMCD_INFRA_ROOM_ID, "(Prepared) " + start[Math.floor(Math.random() * startLength)] + end[Math.floor(Math.random() * endLength)])
}

export default client;
