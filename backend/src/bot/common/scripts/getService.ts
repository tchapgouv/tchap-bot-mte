import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import ldapService, {getDefaultClient} from "../../../services/ldap.service.js";
import {sendMarkdownMessage, sendMessage} from "../helper.js";
import logger from "../../../utils/logger.js";


/**
 * @help
 * command : service @userid
 * return : Je retourne le service auquel appartient le membre (Amande uniquement)
 * isAnswer : true
 */
export function getServicesIfAsked(client: MatrixClient, event: MatrixEvent, body: string, formatted_message: string) {

    const regex: RegExp = /.*service.*@.*/i

    if (regex.test(formatted_message)) {

        const userId = formatted_message.replace(/.*service.*(@.*:.*?\.fr).*/, "$1");
        const botId = client.getUserId() + "";

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id && botId && userId) {

            const roomId = event.event.room_id

            const roomMember = client.getUser(userId)

            if (roomMember && roomMember.displayName) {
                let filter = "(|"
                const userUID = roomMember.displayName.replace(/(.*?) \[.*/, "$1").replaceAll(" ", ".").toLowerCase()
                const domain = roomMember.userId.replace(/@(.*):.*/, "$1").replace(userUID + "-", "")
                const mail = userUID + "@" + domain
                filter += "(mail=" + mail + ")"
                filter += ")"
                logger.debug("listServicesIfAsked filter = ", filter)
                ldapService.getUsersWithLdapRequest(getDefaultClient(), process.env.BASE_DN || '', true, filter).then(agentList => {

                    let message = ""
                    for (const agent of agentList) {
                        if (agent.displayName === 'PAMELA') continue
                        const root = agent.dn.replace(/.*ou=(.*?),ou=organisation.*/, "$1").replace("melanie", "MTEL")
                        message += "- " + agent.displayName + " => `" + root + "/" + agent.departmentNumber + "`\n"
                    }
                    sendMarkdownMessage(client, roomId, message)
                })
            } else {
                sendMessage(client, roomId, "Je n'ai pas réussi à récupérer les détails de l'utilisateur. 🤷")
            }

            return true
        }
    }

    return false
}
