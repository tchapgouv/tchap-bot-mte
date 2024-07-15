import sequelize from "../models/index.js";
import {LdapListGroup} from "../models/ldapListGroup.model.js";
import {Attributes} from "sequelize/lib/model";
import logger from "../utils/logger.js";

const ldapListGroupRepository = sequelize.getRepository(LdapListGroup)

export default {

    async createOrUpdate(room_id: string, bot_id: string, base_dn: string, filter: string = "(&(objectClass=mineqPerson)", recursively: boolean = true, activated: boolean = false): Promise<any> {

        const ldapListGroup = await ldapListGroupRepository.findOne({where: {room_id: room_id}})

        if (!ldapListGroup) {
            return await this.create(room_id, bot_id, base_dn, filter, recursively, activated)
        } else {
            ldapListGroup.set({room_id, bot_id, base_dn, filter, recursively, activated})
            return await ldapListGroup.save()
        }
    },

    async findAll(): Promise<LdapListGroup[]> {

        return await ldapListGroupRepository.findAll()
            .catch(err => {
                logger.error(err)
                throw ({message: err.message || "Some error occurred while retrieving users."});
            });

    },

    async create(room_id: string, bot_id: string, base_dn: string, filter: string = "(&(objectClass=mineqPerson)", recursively: boolean = true, activated: boolean = false): Promise<any> {

        // Create a Webhook
        const ldapListGroupPojo: Attributes<LdapListGroup> = {
            bot_id: bot_id,
            room_id: room_id,
            base_dn: base_dn,
            filter: filter,
            recursively: recursively,
            activated: activated,
        };

        let ldapListGroup
        // Save Webhook in the database
        await ldapListGroupRepository.create(ldapListGroupPojo)
            .then(data => {
                ldapListGroup = data;
            })
            .catch(err => {
                throw (err.message || "Some error occurred while creating ldapListGroupPojo.")
            });

        if (!ldapListGroup) throw ("Some error occurred while creating ldapListGroupPojo.")

        return ldapListGroup
    },

    async destroy(room_id: string) {

        return await ldapListGroupRepository.destroy({where: {room_id: room_id}})
    },

    async findRoomGroup(roomId: string): Promise<LdapListGroup | null> {

        return await ldapListGroupRepository.findOne({where: {room_id: roomId}})
    },

    async activate(room_id: string) {

        const ldapListGroup = await ldapListGroupRepository.findOne({where: {room_id: room_id}})

        if (ldapListGroup) {
            ldapListGroup.set({activated: true})
            return await ldapListGroup.save()
        }
    },

}
