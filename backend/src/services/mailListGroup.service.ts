import sequelize from "../models/index.js";
import {MailListGroup} from "../models/mailListGroup.model.js";
import {Attributes} from "sequelize/lib/model";
import logger from "../utils/logger.js";

const mailListGroupRepository = sequelize.getRepository(MailListGroup)

export default {

    async createOrUpdate(room_id: string, bot_id: string, mail: string, activated: boolean = false): Promise<any> {

        const mailListGroup = await mailListGroupRepository.findOne({where: {room_id: room_id}})

        if (!mailListGroup) {
            return await this.create(room_id, bot_id, mail, activated)
        } else {
            mailListGroup.set({room_id, bot_id, mail, activated})
            return await mailListGroup.save()
        }
    },

    async findAll(): Promise<MailListGroup[]> {

        return await mailListGroupRepository.findAll()
            .catch(err => {
                logger.error(err)
                throw ({message: err.message || "Some error occurred while retrieving users."});
            });

    },

    async findRoomGroup(room_id: string): Promise<MailListGroup | null> {

        return await mailListGroupRepository.findOne({where: {room_id: room_id}})
    },

    async create(room_id: string, bot_id: string, mail: string, activated: boolean = false): Promise<any> {

        // Create a Webhook
        const mailListGroupPojo: Attributes<MailListGroup> = {
            bot_id: bot_id,
            room_id: room_id,
            mail: mail,
            activated: activated
        };

        let mailListGroup
        // Save Webhook in the database
        await mailListGroupRepository.create(mailListGroupPojo)
            .then(data => {
                mailListGroup = data;
            })
            .catch(err => {
                throw (err.message || "Some error occurred while creating mailListGroupPojo.")
            });

        if (!mailListGroup) throw ("Some error occurred while creating mailListGroupPojo.")

        return mailListGroup
    },

    async destroy(room_id: string) {

        return await mailListGroupRepository.destroy({where: {room_id: room_id}})
    },

    async activate(room_id: string) {

        const mailListGroup = await mailListGroupRepository.findOne({where: {room_id: room_id}})

        if (mailListGroup) {
            mailListGroup.set({activated: true})
            return await mailListGroup.save()
        }
    },

}
