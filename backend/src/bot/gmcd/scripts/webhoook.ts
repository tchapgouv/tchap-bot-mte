import {MatrixClient, MatrixEvent} from "matrix-js-sdk";
import logger from "../../../utils/logger.js";
import {sendMessage} from "../helper.js";
import {create, findOne} from "../../../services/webhook.service.js";
import {Webhook} from "../../../models/webhook.model.js";

export function createWebhookIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(create|créé|créer|ajoute|add).*webhook.*/i

    if (regex.test(body)) {

        if (event?.sender?.name &&
            event?.event?.room_id) {

            const roomId = event.event.room_id
            const userName = event.sender.name

            logger.debug("Creating webhook if none exists for " + userName + ".")

            findOne({where: {room_id: roomId}}).then(webhook => {

                if (webhook) {
                    let message = "Un webhook existe déjà pour ce salon 😉 !\n"
                    message += "L'URL est la suivante : \n"
                    message += "https://tchap-bot.mel.e2.rie.gouv.fr/api/webhook/post/" + webhook.dataValues.webhook_id + "\n"
                    message += "La charge utils (body) doit être de la forme suivante :\n"
                    message += "{\n"
                    message += "   message: \"Coucou ! Message envoyé avec un webhook =)\n"
                    message += "}"
                    message += "Amusez vous bien ! 🏌️"
                    sendMessage(client, roomId, message)
                } else {
                    create("Bot - " + userName + " - " + roomId, roomId).then((value: Webhook) => {
                        let message = "J'ai créé un webhook pour vous 🚀 !\n"
                        message += "L'URL est la suivante : \n"
                        message += "https://tchap-bot.mel.e2.rie.gouv.fr/api/webhook/post/" + value.dataValues.webhook_id + "\n"
                        message += "La charge utils (body) doit être de la forme suivante :\n"
                        message += "{\n"
                        message += "   message: \"Coucou ! Message envoyé avec un webhook =)\n"
                        message += "}"
                        message += "Amusez vous bien ! 🏌️"
                        sendMessage(client, roomId, message)
                    }).catch(reason => logger.error("createWebhookIfAsked => create : ", reason));
                }
            })
                .catch(reason => logger.error("createWebhookIfAsked : ", reason));

            return true
        }
    }

    return false
}
