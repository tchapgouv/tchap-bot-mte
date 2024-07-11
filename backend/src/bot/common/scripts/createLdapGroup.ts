import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import {getPowerLevel, sendMessage} from "../helper.js";
import ldapGroupService from "../../../services/ldapGroup.service.js";
import botService from "../../../services/bot.service.js";

/**
 * --help
 * command : create ldap group base_dn:BASE_DN filter:FILTER recursive:true
 * return : je gère les utilisateurs de ce salon en me basant sur une requête ldap <sup>*</sup>
 * isAnswer : true
 */
// create ldap group base_dn:ou=PIAP,ou=GMCD,ou=DETN,ou=UNI,ou=DNUM,ou=SG,ou=AC,ou=melanie,ou=organisation,dc=equipement,dc=gouv,dc=fr
export function createRoomUsersListIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*create ldap group.*/i

    if (regex.test(body)) {

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            const roomId = event.event.room_id
            const userId = event.sender.userId

            getPowerLevel(client, roomId, userId).then(powerLevel => {

                if (powerLevel === 100) {

                    const base_dn = body.match(/.* base_dn:(.*?)[ $].*/i)?.at(1)
                    const filter = body.match(/.* filter:(.*?)[ $].*/i)?.at(1)
                    const recursive = body.includes("recursive:true")

                    if (!base_dn) {
                        sendMessage(client, roomId, "Désolé, il semblerait que vous n'ayez pas fourni de base_dn")
                        return true
                    }

                    ldapGroupService.createOrUpdate(roomId, base_dn, recursive, filter).then(_value => {
                        sendMessage(client, roomId, "Groupe créé, je vais maintenant mettre à jours les membres")
                        botService.updateRoomMemberList(client, roomId)
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
