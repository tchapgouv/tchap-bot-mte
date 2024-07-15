import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import {getPowerLevel, sendMessage} from "../../helper.js";
import mailGroupService from "../../../../services/mailListGroup.service.js";
import botService from "../../../../services/bot.service.js";
import {Brain} from "../../Brain.js";
import logger from "../../../../utils/logger.js";

/**
 * --help
 * command : create mail group mailinglist@developpement-durable.gouv.fr
 * return : je gère les utilisateurs de ce salon en me basant sur une liste ldap <sup>*</sup>
 * isAnswer : true
 */
// create list group Agents.GMCD.DETN.UNI.DNUM.SG@developpement-durable.gouv.fr
export function createMailUsersListIfAsked(client: MatrixClient, event: MatrixEvent, body: string, brain: Brain) {

    const regex: RegExp = /(?=.*(?:create|créer))(?=.*liste?)(?=.*groupe?).* (\S.*@\S.*)/i

    if (event?.sender?.name &&
        event?.sender?.userId &&
        event?.event?.room_id) {

        let botId = client.getUserId() + "";
        const roomId = event.event.room_id
        const userId = event.sender.userId

        if (brain.get("list_group_created") &&
            brain.get("list_group_created").userId === userId &&
            brain.get("list_group_created").roomId === roomId) {

            if (/oui/i.test(body)) {
                mailGroupService.activate(roomId)
                botService.updateRoomMemberList(client, roomId, false).catch(reason => {
                    logger.error("Error while executing : update room member list.", reason)
                })
            } else {
                brain.set("list_group_created", undefined)
                mailGroupService.destroy(roomId).then(_value => {
                    sendMessage(client, roomId, "Configuration du groupe supprimée.")
                })
            }

            return true
        }

        if (regex.test(body)) {

            getPowerLevel(client, roomId, userId).then(powerLevel => {

                if (powerLevel === 100) {

                    const mail = event.event.content?.body.match(/.* (\S.*@\S.*)(?: |$).*/i)?.at(1)

                    if (!mail) {
                        sendMessage(client, roomId, "Désolé, il semblerait que vous n'ayez pas fourni l'adresse mail de la liste.")
                        return true
                    }

                    mailGroupService.createOrUpdate(botId, roomId, mail).then(_value => {
                        sendMessage(client, roomId, "Configuration du groupe créée.")
                        brain.set("list_group_created", {userId, roomId})
                        botService.updateRoomMemberList(client, roomId, true).then(_ => {
                            sendMessage(client, roomId, "Souhaitez vous procéder ? oui/non")
                        }).catch(reason => {
                            logger.error("Error while executing dry : update room member list.", reason)
                        })
                    })

                } else {
                    sendMessage(client, roomId, "Désolé, seul un administrateur me demander cela ! 🤷")
                }
            })

            return true
        }
    }
    return false
}
