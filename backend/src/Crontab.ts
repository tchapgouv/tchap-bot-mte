import crontab from "node-cron";
import logger from "./utils/logger.js";
import ldapGroupService from "./services/ldapListGroup.service.js";
import botService from "./services/bot.service.js";
import mailGroupService from "./services/mailListGroup.service.js";
import fetchWithError from "./utils/fetchWithError.js";
import {CONTEXT} from "./bot/gmcd/scripts/ollama.js";

const MIDNIGHT = '0 0 * * *'

function updateLdapListGroups() {
    ldapGroupService.findAll().then(ldapListGroups => {
        for (const ldapListGroup of ldapListGroups) {
            if (ldapListGroup.getDataValue("activated")) {
                botService.updateRoomMemberList(
                    botService.getBotById(ldapListGroup.getDataValue("bot_id")).client,
                    ldapListGroup.getDataValue("room_id")
                )
            }
        }
    })
}

function updateMailListGroups() {
    mailGroupService.findAll().then(mailListGroups => {
        for (const mailListGroup of mailListGroups) {
            if (mailListGroup.getDataValue("activated")) {
                botService.updateRoomMemberList(
                    botService.getBotById(mailListGroup.getDataValue("bot_id")).client,
                    mailListGroup.getDataValue("room_id")
                )
            }
        }
    })
}

function wakeOllamaUp() {

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    fetchWithError('https://Ollama.gmcd-runner01.eco4.cloud.e2.rie.gouv.fr/api/generate',
        {
            proxify: true,
            timeout: 60 * 1000,
            requestInit: {
                method: "POST", // *GET, POST, PUT, DELETE, etc.
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    "model": "llama3",
                    "prompt": "Bonjour Bot-GMCD, comment vas tu aujourd'hui ?",
                    "context": CONTEXT,
                    "stream": false,
                    "keep_alive": "24h"
                })
            }
        }
    )
        .then(response => response.json())
        .then(data => {
            logger.notice("Ollama wake up response : ", data.response)
        })
        .catch(reason => {
            logger.warning("Ollama wake up error : ", reason)
        })
}

export default class Crontab {

    init() {

        crontab.schedule(MIDNIGHT, () => {

            logger.notice('Running midnight tasks')
            updateLdapListGroups()
            updateMailListGroups()
            wakeOllamaUp()
        });

    }
}
