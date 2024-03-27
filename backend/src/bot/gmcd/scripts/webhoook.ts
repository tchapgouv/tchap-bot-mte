import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../../utils/logger.js";
import {sendHtmlMessage} from "../helper.js";
import {create, findOne} from "../../../services/webhook.service.js";
import {Webhook} from "../../../models/webhook.model.js";

function getWebhookMessage(exists: boolean, webhook_id: any) {
    return (exists ? "Un webhook existe déjà pour ce salon 😉 !\n" : "J'ai créé un webhook pour vous 🚀 !\n") +
        "L'URL est la suivante : \n" +
        "https://tchap-bot.mel.e2.rie.gouv.fr/api/webhook/post/" + webhook_id + "\n" +
        "La charge utile (body) doit être de la forme suivante :\n" +
        "{\n" +
        "   message: \"Coucou ! Message envoyé avec un webhook =)\n" +
        "}\n" +
        "Amusez vous bien ! 🏌️"
}

function aLink(url: string) {
    return "<a href='" + url + "'>" + url + "</a>"
}

function codeBlock(code: string, language: string) {
    return "<pre><code class='language-" + language + "'>" + code + "</code></pre>"
}

function getWebhookHtmlMessage(exists: boolean, webhook_id: any) {
    const url = "https://tchap-bot.mel.e2.rie.gouv.fr/api/webhook/post/" + webhook_id
    return (exists ? "Un webhook existe déjà pour ce salon 😉 !<br>" : "J'ai créé un webhook pour vous 🚀 !<br>") +
        "L'URL est la suivante : <br>" +
        aLink(url) + "<br>" +
        "La charge utile (body) doit être de la forme suivante :<br>" +
        codeBlock(
            "{<br>" +
            "   message: \"Coucou ! Message envoyé avec un webhook =)<br>" +
            "}<br>", "json") +
        "Amusez vous bien ! 🏌️"
}

export function createWebhookIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(create|créé|créer|ajoute|add).*webhook.*/i

    if (regex.test(body)) {

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            const roomId = event.event.room_id
            const userName = event.sender.name
            const userId = event.sender.userId

            const currentUser = client.getStateEvent(roomId, "m.room.power_levels", "").then(value => {
                for (const user of value.users) {
                    logger.debug(user)
                }
                const userPowerlevel = value.users[userId]
                logger.debug(userName + " has powerlevel" + userPowerlevel)
                logger.debug(userPowerlevel > 90 ? "Not admin" :  "Admin")
            })

            logger.debug("Creating webhook if none exists for " + userName + ".")

            findOne({where: {room_id: roomId}}).then(webhook => {

                if (webhook) {

                    const rawMessage = getWebhookMessage(true, webhook.dataValues.webhook_id)
                    const htmlMessage = getWebhookHtmlMessage(true, webhook.dataValues.webhook_id)
                    sendHtmlMessage(client, roomId, rawMessage, htmlMessage)

                } else {
                    create("Bot - " + userName + " - " + roomId, roomId).then((value: Webhook) => {

                        const rawMessage = getWebhookMessage(false, value.dataValues.webhook_id)
                        const htmlMessage = getWebhookHtmlMessage(false, value.dataValues.webhook_id)
                        sendHtmlMessage(client, roomId, rawMessage, htmlMessage)

                    }).catch(reason => logger.error("createWebhookIfAsked => create : ", reason));
                }
            })
                .catch(reason => logger.error("createWebhookIfAsked : ", reason));

            return true
        }
    }

    return false
}
