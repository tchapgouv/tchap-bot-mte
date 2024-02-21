import * as sdk from "matrix-js-sdk";
import {ClientEvent, RoomEvent, RoomMemberEvent} from "matrix-js-sdk";
import olm from "olm";
import logger from "./logger.js";

// noinspection JSUnresolvedReference
global.Olm = olm

const myUserId = "@bot-gmcd-developpement-durable.gouv.fr:agent.dev-durable.tchap.gouv.fr";
const myAccessToken = process.env.BOT_ACCESS_TOKEN;
const myDeviceId = "bot-device-id"
const myBaseUrl = "http://" + process.env.PANTALAIMON_URL
const gmcdInfra = "!pKaqgPaNhBnAvPHjjr:agent.dev-durable.tchap.gouv.fr"


const client = sdk.createClient({
  baseUrl: myBaseUrl, accessToken: myAccessToken, userId: myUserId, deviceId: myDeviceId, usingExternalCrypto: true
});

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

function parseMessageToSelf (event) {

  logger.debug("parseMessageToSelf()")
  logger.debug(event.event)
  logger.debug(event.event.content)
  logger.debug(event.event.content?.body.toLowerCase())

  if (event.event.content?.body && event.event.content.body.toLowerCase().includes("oust")) {
    logger.warning("Someone dismissed me :(")
    sendMessage(event.event.room_id, "Au revoir ! 😭")
    client.leave(event.event.room_id).catch(e => logger.error(e));
    return
  }

  sendMessage(gmcdInfra, "Bonjour " + event.sender.name + ", en quoi puis-je aider ?")
}

// Listen to messages
client.on(RoomEvent.Timeline, function (event, _room, _toStartOfTimeline) {
  logger.debug("-------------------------------------------------------")
  logger.debug(event.getType())
  logger.debug(event);

  if (event.getType() === "m.room.message") {

    if (event.sender.userId === myUserId) {
      logger.info("Message is mine")
      return
    }

    const isSelfMentionned = event.getContent()["m.mentions"]?.user_ids?.indexOf(myUserId) > -1
    logger.debug("Is self mentioned ? ", isSelfMentionned)
    logger.debug("sender = ", event.getSender())
    logger.debug("event age = ", event.event.unsigned?.age)
    const isNewMessage = event.event.unsigned?.age && event.event.unsigned.age < 10 * 1000
    logger.debug("isNewMessage ? ", +isNewMessage)

    if (isSelfMentionned && isNewMessage) {
      parseMessageToSelf(event)
    }

    if ([gmcdInfra].indexOf(event.getRoomId()) > -1) {
      addEmoji(event, ":wave:")
    }
  }
});

function addEmoji (event, emoji) {
  logger.debug("Sending emoji : ", emoji)

  const room = event.getRoomId()

  const content = {
    "body": emoji,
    "msgtype": "m.emote",
    "m.relates_to": event.getId(),
  };

  client.sendEvent(room, "m.reaction", content).then((res) => {
    logger.debug(res);
  }).catch(e => logger.error(e));
}

function sendMessage (room, message) {
  logger.debug("Sending message : ", message)

  const content = {
    "body": message,
    "msgtype": "m.text",
  };
  client.sendEvent(room, "m.room.message", content).then((res) => {
    logger.debug(res);
  }).catch(e => logger.error(e));

}

client.publicRooms(function (err, data) {
  logger.debug("Public Rooms: %s", JSON.stringify(data));
}).catch(e => logger.error(e))

if (!process.env.BOTLESS) {
  await client.startClient().catch(e => logger.error(e))
}

function onPrepared () {
  logger.debug("prepared");
  const start = ['Bonjour à tous', 'Bonjour', 'Salut', 'Hello'];
  const startLength = start.length
  const end = ['.', ' !', ', me revoilà.', '. Je viens de redémarrer ¯\\_(ツ)_/¯', ', encore =)'];
  const endLength = end.length

  sendMessage(gmcdInfra, "(Prepared) " + start[Math.floor(Math.random() * startLength)] + end[Math.floor(Math.random() * endLength)])
}

export default client;
