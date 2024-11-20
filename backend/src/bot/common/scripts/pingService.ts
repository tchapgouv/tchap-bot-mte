import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import ldapService, {getDefaultClient} from "../../../services/ldap.service.js";
import {sendMarkdownMessage, sendMessage} from "../helper.js";
import logger from "../../../utils/logger.js";


/**
 * @help
 * command : ping service @SERVICE/CIBLE
 * return : j'interpelle les membres d'un service présent dans le salon (Amande uniquement)
 * isAnswer : false
 */
export function pingService(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*ping +service +@.*/i

    if (regex.test(body)) {

        let service = body.replace(/.*ping +service +@(.*)/, "$1");

        let botId = client.getUserId() + "";

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id && botId) {

            const roomId = event.event.room_id

            const roomMemberList = client.getRoom(roomId)?.getMembers()

            if (roomMemberList && roomMemberList.length > 0) {
                let filter = "(|"
                for (const roomMember of roomMemberList) {
                    const userUID = roomMember.name.replace(/(.*?) \[.*/, "$1").replaceAll(" ", ".").toLowerCase()
                    const domain = roomMember.userId.replace(/@(.*):.*/, "$1").replace(userUID + "-", "")
                    const mail = userUID + "@" + domain
                    filter += "(mail=" + mail + ")"
                }
                filter += ")"
                logger.debug("listServicesIfAsked filter = ", filter)
                ldapService.getUsersWithLdapRequest(getDefaultClient(), process.env.BASE_DN || '', true, filter).then(agentList => {

                    let filteredAgentList = agentList.filter(agent => {
                        if (agent.displayName === 'PAMELA') return false
                        const root = agent.dn.replace(/.*ou=(.*?),ou=organisation.*/, "$1").replace("melanie", "MTEL")
                        const fullDn = root + "/" + agent.departmentNumber
                        return service.toLowerCase() === fullDn.toLowerCase()
                    });

                    if (filteredAgentList.length === 0) {
                        sendMessage(client, roomId, "Aucun membre du salon ne semble appartenir au service mentionné. 🤷")
                        return
                    }

                    let message = "Ping "
                    for (const agent of filteredAgentList) {
                        const agentInternalId = "@" + agent.mailPR.replace("@","-") + ":agent.dev-durable.tchap.gouv.fr"
                        message += `[${agentInternalId}](https://matrix.to/#/${agentInternalId}) `
                    }
                    sendMarkdownMessage(client, roomId, message)
                })
            } else {
                sendMessage(client, roomId, "Je n'ai pas réussi à récupérer la liste des membres du salon. 🤷")
            }

            return true
        }
    }

    return false
}
