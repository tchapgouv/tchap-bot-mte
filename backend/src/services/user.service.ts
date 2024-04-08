import sequelize from "../models/index.js";
import {User} from "../models/user.model.js";
import logger from "../utils/logger.js";

// const Op = db.Sequelize.Op;

const userRepository = sequelize.getRepository(User)

export default {

    async create(username: string): Promise<any> {

        return await userRepository.findOrCreate({
            where: {
                username: username
            },
            defaults: {
                username: username
            }
        }).then(value => {
            return value
        }).catch(err => {
            logger.error(err)
            throw ({message: err.message || "Some error occurred while retrieving users."});
        });
    },

    async findAll(): Promise<User[]> {

        return await userRepository.findAll()
            .catch(err => {
                logger.error(err)
                throw ({message: err.message || "Some error occurred while retrieving users."});
            });

    },

    async findAllUsernames(): Promise<{ id: string, username: string }[]> {

        return await userRepository.findAll()
            .then(data => {
                return (data.map((value) => {
                    return {
                        id: value.dataValues.id, username: value.dataValues.username
                    }
                }))
            })
            .catch(err => {
                logger.error(err)
                throw ({message: err.message || "Some error occurred while retrieving users."});
            });
    },

}
