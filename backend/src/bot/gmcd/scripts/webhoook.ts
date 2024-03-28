import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../../utils/logger.js";
import {getUserPowerLevel, sendHtmlMessage, sendMessage} from "../helper.js";
import {create, findOne} from "../../../services/webhook.service.js";
import {Webhook} from "../../../models/webhook.model.js";
import {User} from "../../classes/user.js";
import {aLink, codeBlock} from "../htmlFormatHelpers.js";

function getWebhookMessage(exists: boolean, webhook_id: any) {
    return (exists ? "Un webhook existe déjà pour ce salon 😉 !\n" : "J'ai créé un webhook pour vous 🚀 !\n") +
        "L'URL est la suivante : \n" +
        "https://tchap-bot.mel.e2.rie.gouv.fr/api/webhook/post/" + webhook_id + "\n" +
        "La charge utile (body) doit être de la forme suivante :\n" +
        "{\n" +
        "   \"message\": \"Coucou ! Message envoyé avec un webhook =)\"\n" +
        "}\n" +
        "Amusez vous bien ! 🏌️"
}

function getWebhookHtmlMessage(exists: boolean, webhook_id: any) {
    const url = "https://tchap-bot.mel.e2.rie.gouv.fr/api/webhook/post/" + webhook_id
    return (exists ? "Un webhook existe déjà pour ce salon 😉 !<br>" : "J'ai créé un webhook pour vous 🚀 !<br>") +
        "L’URL est la suivante : <br>" +
        aLink(url) + "<br>" +
        "La charge utile (body) doit être de la forme suivante :<br>" +
        codeBlock(
            "{\n" +
            "   \"message\": \"Coucou ! Message envoyé avec un webhook =)\"\n" +
            "}\n", "json") +
        "Amusez vous bien ! 🏌️"
}

function createOrReturnWebhook(client: MatrixClient, roomId: string, user: User, webhook: Webhook | null) {
    if (webhook) {

        const rawMessage = getWebhookMessage(true, webhook.dataValues.webhook_id)
        const htmlMessage = getWebhookHtmlMessage(true, webhook.dataValues.webhook_id)
        sendHtmlMessage(client, roomId, rawMessage, htmlMessage)

    } else {

        create("Bot - " + user.username + " - " + roomId, roomId).then((value: Webhook) => {

            const rawMessage = getWebhookMessage(false, value.dataValues.webhook_id)
            const htmlMessage = getWebhookHtmlMessage(false, value.dataValues.webhook_id)
            sendHtmlMessage(client, roomId, rawMessage, htmlMessage)

        }).catch(reason => logger.error("createWebhookIfAsked => create : ", reason));
    }
}

export function createWebhookIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(create|créé|créer|ajoute|add).*webhook.*/i

    if (regex.test(body)) {

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            const roomId = event.event.room_id

            getUserPowerLevel(client, event).then(user => {

                if (user?.isAdministrator) {

                    logger.debug("Creating webhook if none exists for " + user.username + ".")

                    findOne({where: {room_id: roomId}}).then(webhook => {

                        createOrReturnWebhook(client, roomId, user, webhook)

                    }).catch(reason => logger.error("createWebhookIfAsked : ", reason));
                } else {
                    sendMessage(client, roomId, "Désolé, seul un administrateur peut ajouter un webhook ! 🤷")
                }
            })
            return true
        }
    }

    return false
}
