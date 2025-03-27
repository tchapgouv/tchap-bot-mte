import {MatrixClient} from "matrix-js-sdk";
import {getPowerLevel, isSupport, sendMessage} from "../helper.js";
import botService from "../../../services/bot.service.js";
import logger from "../../../utils/logger.js";

export function inviteInRoomIfAsked(client: MatrixClient, roomId: string, userId: string, body: string, raw_body: string) {

    const inviteInRoomOptions = ["invite"]

    if (roomId && body && inviteInRoomOptions.some(option => body.includes(option))) {

        // @Bot-Gmcd invite @quentin.rabier-developpement-durable.gouv.fr:agent.dev-durable.tchap.gouv.fr !GCDRinCBfdhIEpoecb:agent.dev-durable.tchap.gouv.fr
        // @quentin.rabier-developpement-durable.gouv.fr:agent.dev-durable.tchap.gouv.fr
        // !GCDRinCBfdhIEpoecb:agent.dev-durable.tchap.gouv.fr

        let roomToInvite = raw_body.replace(/.*invite +@.*? +(!.*?)(?: |$).*/, "$1"); // Sensible à la casse !
        let userToInvite = body.replace(/.*invite +(@.*?) +!.*?(?: |$).*/, "$1");

        if (isSupport(userId)) {

            botService.getRoomName(roomToInvite).then(_ => {

                botService.isMemberOfRoom(roomToInvite, client.getUserId() + '').then(isMember => {

                    if (!isMember) {
                        sendMessage(client, roomId, `Désolé, je ne suis pas membre de ${roomToInvite} ! 🤷`)
                        return true
                    }

                    getPowerLevel(client, roomId).then(powerLevel => {

                        if (powerLevel < 100) {
                            sendMessage(client, roomId, `Désolé, je ne suis pas administrateur de ${roomToInvite} ! 🤷`)
                            return true
                        }

                        client.invite(roomToInvite, userToInvite).then(() => {
                            sendMessage(client, roomId, `L'utilisateur ${userToInvite} a bien été invité dans la salle ${roomToInvite} ! 🎉`)
                        }).catch(reason => {
                            sendMessage(client, roomId, "Une erreur est survenue ! 🤷")
                            logger.error(`Inviting ${userToInvite} in ${roomToInvite} `, reason)
                        })
                    })
                })

            }).catch(() => {
                sendMessage(client, roomId, `Désolé, je ne connais pas le salon ${roomToInvite} ! 🤷`)
                return true
            })

        } else {
            sendMessage(client, roomId, "Désolé, seul un membre du support pour réaliser cette action ! 🤷")
        }

        return true
    }
    return false
}
