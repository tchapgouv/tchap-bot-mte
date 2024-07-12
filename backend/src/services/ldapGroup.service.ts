import sequelize from "../models/index.js";
import {LdapGroup} from "../models/ldapGroup.model.js";
import {Attributes} from "sequelize/lib/model";
import logger from "../utils/logger.js";

const ldapGroupRepository = sequelize.getRepository(LdapGroup)

export default {

    async createOrUpdate(bot_id: string, room_id: string, base_dn: string, recursively: boolean = false, filter: string = "(&(objectClass=mineqPerson)"): Promise<any> {

        const ldapGroup = await ldapGroupRepository.findOne({where: {room_id: room_id}})

        if (!ldapGroup) {
            return await this.create(bot_id, room_id, base_dn, recursively, filter)
        } else {
            ldapGroup.set({bot_id, room_id, base_dn, recursively, filter})
            return await ldapGroup.save()
        }
    },

    async findAll(): Promise<LdapGroup[]> {

        return await ldapGroupRepository.findAll()
            .catch(err => {
                logger.error(err)
                throw ({message: err.message || "Some error occurred while retrieving users."});
            });

    },

    async create(bot_id:string, room_id: string, base_dn: string, recursively: boolean = false, filter: string = "(&(objectClass=mineqPerson)"): Promise<any> {

        // Create a Webhook
        const ldapGroupPojo: Attributes<LdapGroup> = {
            bot_id: bot_id,
            room_id: room_id,
            base_dn: base_dn,
            recursively: recursively,
            filter: filter
        };

        let ldapGroup
        // Save Webhook in the database
        await ldapGroupRepository.create(ldapGroupPojo)
            .then(data => {
                ldapGroup = data;
            })
            .catch(err => {
                throw (err.message || "Some error occurred while creating ldapGroupPojo.")
            });

        if (!ldapGroup) throw ("Some error occurred while creating ldapGroupPojo.")

        return ldapGroup
    },

    async destroy(room_id: string) {

        return await ldapGroupRepository.destroy({where: {room_id: room_id}})
    },

}
