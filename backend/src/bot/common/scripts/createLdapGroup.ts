import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import {getPowerLevel, sendMessage} from "../helper.js";
import ldapGroupService from "../../../services/ldapGroup.service.js";
import botService from "../../../services/bot.service.js";
import {Brain} from "../Brain.js";
import logger from "../../../utils/logger.js";

/**
 * --help
 * command : create ldap group basedn:BASE_DN filter:FILTER recursive:true
 * return : je gère les utilisateurs de ce salon en me basant sur une requête ldap <sup>*</sup>
 * isAnswer : true
 */
// create ldap group basedn:ou=PIAP,ou=GMCD,ou=DETN,ou=UNI,ou=DNUM,ou=SG,ou=AC,ou=melanie,ou=organisation,dc=equipement,dc=gouv,dc=fr filter:(&(mailPr=*gouv.fr)(objectclass=mineqPerson))
export function createRoomUsersListIfAsked(client: MatrixClient, event: MatrixEvent, body: string, brain: Brain) {


    if (event?.sender?.name &&
        event?.sender?.userId &&
        event?.event?.room_id) {

        let botId = client.getUserId() + "";
        const roomId = event.event.room_id
        const userId = event.sender.userId

        if (brain.get("group_created") &&
            brain.get("group_created").userId === userId &&
            brain.get("group_created").roomId === roomId) {

            if (/oui/i.test(body)) {
                botService.updateRoomMemberList(client, roomId, false).catch(reason => {
                    logger.error("Error while executing : update room member list.", reason)
                })
            } else {
                brain.set("group_created", undefined)
                ldapGroupService.destroy(roomId).then(_value => {
                    sendMessage(client, roomId, "Configuration du groupe supprimée.")
                })
            }

            return true
        }

        if (/.*create ldap group.*/i.test(body)) {

            getPowerLevel(client, roomId, userId).then(powerLevel => {

                if (powerLevel === 100) {

                    const base_dn = event.event.content?.body.match(/.* basedn:(.*?)(?: |$).*/i)?.at(1)
                    const filter = event.event.content?.body.match(/.* filter:(.*?)(?: |$).*/i)?.at(1)
                    const recursive = body.includes("recursive:true")

                    if (!base_dn) {
                        sendMessage(client, roomId, "Désolé, il semblerait que vous n'ayez pas fourni de basedn")
                        return true
                    }

                    ldapGroupService.createOrUpdate(botId, roomId, base_dn, recursive, filter).then(_value => {
                        sendMessage(client, roomId, "Configuration du groupe créée.")
                        brain.set("group_created", {userId, roomId})
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
