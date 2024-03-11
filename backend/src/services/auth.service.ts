import jwt, {JwtPayload} from 'jsonwebtoken';
import ldap from "ldapjs"
import logger from "../utils/logger.js";
import {User} from "../models/user.model.js";
import sequelize from "../models/index.js";
import {getUserForUID} from "./ldap.service.js";

const userRepository = sequelize.getRepository(User)

export async function getAllUsers() {

    return await userRepository.findAll()
        .then(data => {
            return data.map((value) => {
                return {
                    id: value.dataValues.id, username: value.dataValues.username
                }
            })
        })
        .catch(err => {
            logger.error(err)
        });
}

export async function verifyJwt(token: string) {

    logger.debug(">>>> verifyJwt")

    // decode cookie and get user id
    const decoded = decodeToken(token)

    logger.debug("Decoded token : ", decoded)

    let user
    // find the user
    await getAllUsers().then((users) => {
        user = users?.find(u => u.username === decoded.uid[0]);
    })

    logger.notice("User found : ", user)

    return user
}

function decodeToken(token: string) {
    if (!process.env.JWT_KEY) {
        logger.alert("No JWT Key provided in .env file, this is a security risk.")
        throw ({message: "Missing JWT Key, please contact the administrator"});
    }
    const payload = jwt.verify(token, process.env.JWT_KEY)
    if (typeof payload === 'string') {
        const jwtpayload: JwtPayload =
            {
                data: payload
            }
        return jwtpayload
    }
    return payload;
}

export async function getUserFromToken(token: string) {

    // decode cookie and get user id
    const decoded = decodeToken(token)
    const userId = decoded.id;

    await getAllUsers().then((users) => {
        return users?.find(u => u.id === userId)
    })
}

export async function ldapAuth(username: string, password: string) {

    logger.debug(process.env.LDAP_URI)
    logger.debug(process.env.BASE_DN)

    const client = ldap.createClient({
        url: process.env.LDAP_URI || '',

        // baseDN: process.env.BASE_DN || ''
    });

    let user: any = {}
    await getUserForUID(client, username).then(value => user = value)

    return new Promise((resolve, reject) => {

        if (!user.dn) reject({message: "User not found !"})

        client.bind(user.dn, password, (error, _response) => {

            // logger.debug(response)

            if (error) {

                client.unbind(() => {
                    logger.debug('Disconnecting.');
                });
                logger.alert("LDAP binding failed.")
                reject({message: error.message})

            } else {

                logger.notice(username + " : Logged in")
                resolve(user)
            }
        })
    })
}
