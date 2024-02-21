import * as sdk from "matrix-js-sdk";
import {ClientEvent, RoomEvent, RoomMemberEvent} from "matrix-js-sdk";
import olm from "olm";

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
    // console.log(state);
  }
});

// Listen for low-level MatrixEvents
client.on(ClientEvent.Event, function (event) {
  console.log(event.getType());
});

// Listen for typing changes
client.on(RoomMemberEvent.Typing, function (event, member) {
  if (member.typing) {
    console.log(member.name + " is typing...");
  } else {
    console.log(member.name + " stopped typing.");
  }
});

// Auto join rooms
client.on(RoomMemberEvent.Membership, function (event, member) {
  if (member.membership === "invite" && member.userId === myUserId) {
    client.joinRoom(member.roomId).then(function () {
      console.log("Auto-joined %s", member.roomId);
    });
  }
});

function parseMessageToSelf (event) {

  console.log("parseMessageToSelf()")
  console.log(event.event)
  console.log(event.event.content)
  console.log(event.event.content?.body.toLowerCase())

  if (event.event.content?.body && event.event.content.body.toLowerCase().includes("oust")) {
    console.log("Someone dismissed me :(")
    sendMessage(event.event.room_id, "Au revoir ! 😭")
    client.leave(event.event.room_id).catch(e => console.error(e));
    return
  }

  sendMessage(gmcdInfra, "Bonjour " + event.sender.name + ", en quoi puis-je aider ?")
}

// Listen to messages
client.on(RoomEvent.Timeline, function (event, _room, _toStartOfTimeline) {
  console.log("-------------------------------------------------------")
  console.log(event.getType())


  if (event.getType() === "m.room.message") {

    if (event.sender.userId === myUserId) {
      console.log("Message is mine")
      return
    }

    console.log(event);

    const isSelfMentionned = event.getContent()["m.mentions"]?.user_ids?.indexOf(myUserId) > -1
    console.log("Is self mentioned ?")
    console.log(isSelfMentionned)
    console.log("sender :")
    console.log(event.getSender())
    console.log("event age = " + event.event.unsigned?.age)
    const isNewMessage = event.event.unsigned?.age && event.event.unsigned.age < 10 * 1000
    console.log("isNewMessage ? " + isNewMessage)

    if (isSelfMentionned && isNewMessage) {
      parseMessageToSelf(event)
    }
  }
});

function sendMessage (room, message) {

  const content = {
    body: message, msgtype: "m.text",
  };
  client.sendEvent(room, "m.room.message", content, "", (err, _res) => {
    console.log(err);
  }).catch(e => console.error(e));

}

client.publicRooms(function (err, data) {
  console.log("Public Rooms: %s", JSON.stringify(data));
}).catch(e => console.error(e))

if (!process.env.BOTLESS) {
  await client.startClient().catch(e => console.error(e))
}

function onPrepared () {
  console.log("prepared");
  const start = ['Bonjour à tous', 'Bonjour', 'Salut', 'Hello'];
  const startLength = start.length
  const end = ['.', ' !', ', me revoilà.', '. Je viens de redémarrer ¯\\_(ツ)_/¯', ', encore =)'];
  const endLength = end.length

  sendMessage(gmcdInfra, "(Prepared) " + start[Math.floor(Math.random() * startLength)] + end[Math.floor(Math.random() * endLength)])
}

export default client;
