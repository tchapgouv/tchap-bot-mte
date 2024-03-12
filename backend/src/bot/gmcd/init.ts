import logger from "../../utils/logger.js";
import * as sdk from "matrix-js-sdk";
import {ClientEvent, EventType, RoomEvent, RoomMemberEvent} from "matrix-js-sdk";
import {GMCD_INFRA_ROOM_ID, myAccessToken, myBaseUrl, myDeviceId, myIdBaseUrl, myUserId} from "./config.js";
import {sendMessage} from "./helper.js";
import {parseMessage, parseMessageToSelf} from "./answer.js";
import bot from "./bot.js";

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

async function getIdentityServerToken(): Promise<string | null> {

    return new Promise((resolve, _reject) => {

        bot.getOpenIdToken().then(openIdToken => {
            bot.registerWithIdentityServer(openIdToken).then(value => {
                logger.notice("registerWithIdentityServer : ", value)
                resolve(value.token)
            }).catch(reason => {
                logger.error("registerWithIdentityServer : ", reason)
                resolve(null)
            })
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
