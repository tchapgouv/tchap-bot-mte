import crontab from "node-cron";
import logger from "./utils/logger.js";
import ldapGroupService from "./services/ldapListGroup.service.js";
import botService from "./services/bot.service.js";
import mailGroupService from "./services/mailListGroup.service.js";

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

export default class Crontab {

    init() {

        crontab.schedule(MIDNIGHT, () => {

            logger.notice('Running midnight tasks');
            updateLdapListGroups();
            updateMailListGroups();
        });

    }
}
