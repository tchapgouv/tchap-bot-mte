import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import ldapService, {Agent, getDefaultClient} from "../../../services/ldap.service.js";
import {fullDnFromAgent, mailFromRoomMember, sendMarkdownMessage, sendMessage} from "../helper.js";
import logger from "../../../utils/logger.js";


/**
 * @help
 * command : list|lister services
 * return : je fais la liste des services des membres du salon (Amande uniquement)<br/> Options : <br/>    - `--full|-f` liste les services et leurs membres
 * isAnswer : true
 */
export function listServicesIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(list|lister) service.*/i

    if (regex.test(body)) {

        const full = /.*(-f|full|complet|complète).*/i.test(body)

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
                logger.debug("listServicesIfAsked filter = ", filter)
                ldapService.getUsersWithLdapRequest(getDefaultClient(), process.env.BASE_DN || '', true, filter).then(agentList => {

                    let message = "Voici la liste des services d'appartenance des agents présents dans ce salon :"
                    let serviceDict: { [id: string]: Agent[] } = {}
                    for (const agent of agentList) {
                        if (agent.displayName === 'PAMELA') continue
                        const fullDn = fullDnFromAgent(agent)
                        if (!serviceDict[fullDn]) serviceDict[fullDn] = []
                        serviceDict[fullDn].push(agent)
                    }

                    let serviceList = Object.keys(serviceDict)
                    serviceList.sort((a, b) => a.localeCompare(b))

                    for (const service of serviceList) {

                        if (full) {
                            message += "`" + service + "` : \n"
                            serviceDict[service].sort((a, b) => a.displayName.localeCompare(b.displayName))
                            for (const agent of serviceDict[service]) {
                                message += "- " + agent.displayName + "\n"
                            }
                            message += "\n"
                        } else {
                            message += "- `" + service + "` (" + serviceDict[service].length + ")\n"
                        }
                    }

                    sendMarkdownMessage(client, roomId, message)
                }).catch(_ => {
                    sendMessage(client, roomId, "Je n'ai pas réussi à récupérer la liste des membres du salon. 🤷")
                })
            } else {
                sendMessage(client, roomId, "Je n'ai pas réussi à récupérer la liste des membres du salon. 🤷")
            }

            return true
        }
    }

    return false
}
