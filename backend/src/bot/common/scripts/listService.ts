import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import ldapService, {Agent, getDefaultClient} from "../../../services/ldap.service.js";
import {sendMarkdownMessage, sendMessage} from "../helper.js";
import logger from "../../../utils/logger.js";


/**
 * @help
 * command : list|lister services
 * return : je fais la liste des services des membres du salon (Amande uniquement)<br/> Options : <br/> - `--full` liste les services et leurs membres
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
                    const userUID = roomMember.name.replace(/(.*?) \[.*/, "$1").replaceAll(" ", ".").toLowerCase()
                    const domain = roomMember.userId.replace(/@(.*):.*/, "$1").replace(userUID + "-", "")
                    const mail = userUID + "@" + domain
                    filter += "(mail=" + mail + ")"
                }
                filter += ")"
                logger.debug("listServicesIfAsked filter = ", filter)
                ldapService.getUsersWithLdapRequest(getDefaultClient(), process.env.BASE_DN || '', true, filter).then(agentList => {

                    let message = ""
                    if (full) {
                        let serviceDict: { [id: string]: Agent[] } = {}
                        for (const agent of agentList) {
                            if (agent.displayName === 'PAMELA') continue
                            const root = agent.dn.replace(/.*ou=(.*?),ou=organisation.*/, "$1").replace("melanie", "MTEL")
                            const fullDn = root + "/" + agent.departmentNumber
                            if (!serviceDict[fullDn]) serviceDict[fullDn] = []
                            serviceDict[fullDn].push(agent)
                        }
                        let serviceList = Object.keys(serviceDict)
                        serviceList.sort((a, b) => a.localeCompare(b))

                        for (const service of serviceList) {
                            message += "- `" + service + "` : \n"
                            for (const agent of serviceDict[service]) {
                                message += "  - " + agent.displayName + "`\n"
                            }
                        }
                    } else {
                        let dnList = []
                        for (const agent of agentList) {
                            if (agent.displayName === 'PAMELA') continue
                            const root = agent.dn.replace(/.*ou=(.*?),ou=organisation.*/, "$1").replace("melanie", "MTEL")
                            const fullDn = root + "/" + agent.departmentNumber
                            dnList.push(fullDn)
                        }
                        dnList.sort((a, b) => a.localeCompare(b))
                        let previousDn: string | null = null
                        let count = 0
                        for (let i = 0; i < dnList.length; i++) {
                            const dn = dnList[i];
                            const isLast = i == dnList.length - 1
                            if (previousDn === null) previousDn = dn
                            if (previousDn === dn) count++
                            if (previousDn !== dn) {
                                message += "- `" + previousDn + "` (" + count + ")\n"
                                count = 1
                            }
                            if (isLast) {
                                message += "- `" + dn + "` (" + (previousDn !== dn ? 1 : count) + ")\n"
                            }
                            previousDn = dn
                        }
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
