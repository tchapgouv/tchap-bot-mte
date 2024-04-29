import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../../utils/logger.js";
import {getUserPowerLevel, sendHtmlMessage, sendMessage} from "../helper.js";
import webhookService from "../../../services/webhook.service.js";
import {Webhook} from "../../../models/webhook.model.js";
import {User} from "../../classes/User.js";
import {aLink, codeBlock} from "../htmlFormatHelpers.js";
import {Op} from "sequelize";

function getWebhookMessage(exists: boolean, webhook_id: any) {
    return (exists ? "Un webhook existe déjà pour ce salon 😉 !\n" : "J'ai créé un webhook pour vous 🚀 !\n") +
        "L'URL est la suivante : \n" +
        "https://tchap-bot.mel.e2.rie.gouv.fr/api/webhook/post/" + webhook_id + "\n" +
        "La charge utile (body) doit être de la forme suivante :\n" +
        "{\n" +
        "   \"message\": \"Coucou ! Message envoyé avec un webhook =)\",\n" +
        "   \"message_format\": \"\"\n" +
        "   \"message_raw\": \"\"\n" +
        "}\n" +
        "`message_format` est optionnel. Il peut prendre les valeurs suivantes : `html|md|markdown`" +
        "`message_raw` est optionnel. Il permet de fournir une alternative texte brut au message si un format est spécifié (Typiquement pour les clients mobiles)" +
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
            "   \"message\": \"Coucou ! Message envoyé avec un webhook =)\",\n" +
            "   \"message_format\": \"\"\n" +
            "   \"message_raw\": \"\"\n" +
            "}\n", "json") +
        "<code>message_format</code> est optionnel. Il peut prendre les valeurs suivantes : <code>html|md|markdown</code><br>" +
        "<code>message_raw</code> est optionnel. Il permet de fournir une alternative texte brut au message si un format est spécifié (Typiquement pour les clients mobiles)<br>" +
        "Amusez vous bien ! 🏌️"
}

function createOrReturnWebhook(client: MatrixClient, roomId: string, user: User, webhook: Webhook | null) {

    if (webhook) {

        const rawMessage = getWebhookMessage(true, webhook.dataValues.webhook_id)
        const htmlMessage = getWebhookHtmlMessage(true, webhook.dataValues.webhook_id)
        sendHtmlMessage(client, roomId, rawMessage, htmlMessage)

    } else {

        const roomName = client.getRoom(roomId)?.name || roomId

        webhookService.create("Bot - " + user.username + " - " + roomName, roomId, client.getUserId() || "" + process.env.BOT_USER_ID).then((value: Webhook) => {

            const rawMessage = getWebhookMessage(false, value.dataValues.webhook_id)
            const htmlMessage = getWebhookHtmlMessage(false, value.dataValues.webhook_id)
            sendHtmlMessage(client, roomId, rawMessage, htmlMessage)

        }).catch(reason => logger.error("createWebhookIfAsked => create : ", reason));
    }
}


/**
 * @help
 * command : create webhook|créer webhook
 * return : je créé un webhook (RIE) pour le canal afin d'y envoyer des messages (Administrateur uniquement !)
 * isAnswer : true
 */
export function createWebhookIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(create|créé|créer|ajoute|add).*webhook.*/i

    if (regex.test(body)) {

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            const roomId = event.event.room_id

            getUserPowerLevel(client, event).then(user => {

                logger.debug(user)

                if (user?.isAdministrator) {

                    logger.debug("Creating webhook if none exists for " + user.username + ".")

                    webhookService.findOne({where: {[Op.and]: [{room_id: roomId}, {bot_id: client.getUserId()}]}}).then(webhook => {

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
