import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import ldapService, {getDefaultClient} from "../../../services/ldap.service.js";
import {fullDnFromAgent, getMatrixIdFromLdapAgent, mailFromRoomMember, sendMarkdownMessage, sendMessage} from "../helper.js";
import logger from "../../../utils/logger.js";


/**
 * @help
 * command : ping service @SERVICE/CIBLE
 * return : j'interpelle les membres d'un service présent dans le salon (Amande uniquement)
 * isAnswer : false
 */
export function pingService(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*ping +service +@.*/i

    logger.debug("pingService", regex)
    logger.debug("pingService", body)
    logger.debug("pingService", regex.test(body))

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
                    const mail = mailFromRoomMember(roomMember.name, roomMember.userId)
                    filter += "(mail=" + mail + ")"
                }
                filter += ")"
                logger.debug("pingService filter = ", filter)
                ldapService.getUsersWithLdapRequest(getDefaultClient(), process.env.BASE_DN || '', true, filter).then(agentList => {

                    let filteredAgentList = agentList.filter(agent => {
                        if (agent.displayName === 'PAMELA') return false
                        const fullDn = fullDnFromAgent(agent)
                        return service.toLowerCase() === fullDn.toLowerCase() || fullDn.toLowerCase().includes("/" + service.toLowerCase())
                    })

                    if (filteredAgentList.length === 0) {
                        sendMarkdownMessage(client, roomId, "Aucun membre du salon ne semble appartenir au service `" + service + "`. 🤷")
                        return
                    }

                    let message = "Ping `@" + service.toUpperCase() + "`\n"
                    for (const agent of filteredAgentList) {
                        const matrixId = getMatrixIdFromLdapAgent(agent, client.getRoom(roomId))
                        message += `- [${matrixId}](https://matrix.to/#/${matrixId}) \n`
                    }
                    sendMarkdownMessage(client, roomId, message)
                }).catch(_ => {
                    sendMessage(client, roomId, "Je n'ai pas réussi à récupérer les détails de l'utilisateur. 🤷")
                })
            } else {
                sendMessage(client, roomId, "Je n'ai pas réussi à récupérer la liste des membres du salon. 🤷")
            }

            return true
        }
    }

    return false
}
