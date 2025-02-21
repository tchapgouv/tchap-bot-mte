import {MatrixClient} from "matrix-js-sdk";
import {isSupport, sendMessage} from "../helper.js";
import botGmcd from "../../gmcd/bot.js";

export function inviteInRoomIfAsked(client: MatrixClient, roomId: string, userId: string, body: string) {

    const inviteInRoomOptions = ["invite"]

    if (roomId && body && inviteInRoomOptions.some(option => body.includes(option))) {

        // @quentin.rabier-developpement-durable.gouv.fr:agent.dev-durable.tchap.gouv.fr
        // !PHwHATDnuimhMowBKN:agent.dev-durable.tchap.gouv.fr

        let roomToInvite = body.replace(/.*invite +@.*? +(!.*?)(?: |$).*/, "$1");
        let userToInvite = body.replace(/.*invite +(@.*?) +!.*?(?: |$).*/, "$1");

        if (isSupport(userId)) {

            botGmcd.client.invite(roomToInvite, userToInvite).then(() => {
                sendMessage(botGmcd.client, roomId, `L'utilisateur ${userToInvite} a bien été invité dans la salle ${roomToInvite} ! 🎉`)
            })

        } else {
            sendMessage(client, roomId, "Désolé, seul un membre du support pour réaliser cette action ! 🤷")
        }

        return true
    }
    return false
}
