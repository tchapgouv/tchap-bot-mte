import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import ldapService, {getDefaultClient} from "../../../services/ldap.service.js";
import {sendMessage} from "../helper.js";


/**
 * @help
 * command : list alias|lister services
 * return : je fais la liste des services des membres du salon
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
                    const userUID = roomMember.userId.replace(/@(.*?\..*?)-.*:.*/, "$1")
                    filter += "(uid=" + userUID + ")"
                }
                filter += ")"
                ldapService.getUsersWithLdapRequest(getDefaultClient(), process.env.BASE_DN || '', true, filter).then(agentList => {

                    let message = ""
                    if (full) {
                        for (const agent of agentList) {
                            message += "- "+ agent.displayName + " => " + agent.mailPR + "\n"
                        }
                    }
                    console.log(agentList[0])
                    const agent = agentList[0]
                    message += "- agent.mailPR = " + agent.mailPR + "\n"
                    message += "- agent.objectClass = " + agent.objectClass + "\n"
                    message += "- agent.displayName = " + agent.displayName + "\n"
                    message += "- agent.uid = " + agent.uid + "\n"
                    message += "- agent.dn = " + agent.dn + "\n"
                    message += "- agent.cn = " + agent.cn + "\n"
                    message += "- agent.mail = " + agent.mail + "\n"
                    sendMessage(client, roomId, message)
                })
            } else {
                sendMessage(client, roomId, "Je n'ai pas réussi à récupérer la liste des membres du salon. 🤷")
            }

            return true
        }
    }

    return false
}
