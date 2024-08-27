import jwt, {JwtPayload} from 'jsonwebtoken';
import ldap from "ldapjs"
import logger from "../utils/logger.js";
import ldapService, {Agent} from "./ldap.service.js";
import userService from "./user.service.js";

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


export default {

    async verifyJwt(token: string) {

        logger.debug(">>>> verifyJwt")

        // decode user_token
        const decoded_agent = decodeToken(token) as Agent
        if (!decoded_agent.uid) return null

        logger.debug("Decoded token : ", decoded_agent)

        let user
        // find the user
        await userService.findAllUsernames().then((users) => {
            user = users?.find(u => u.username === decoded_agent.uid);
        })

        logger.notice("User found : ", user)

        return user

    },


    async getUserFromToken(token: string): Promise<{ id: string, username: string } | undefined> {

        // decode cookie and get user id
        const decoded = decodeToken(token)
        const userId = decoded.id;

        let user = undefined

        await userService.findAllUsernames().then((users) => {
            user = users?.find(u => u.id === userId)
        })

        return user
    },

    ldapAuth(username: string, password: string): Promise<Agent> {

        return new Promise<Agent>((resolve, reject) => {
            (async () => {

                logger.debug(process.env.LDAP_URI)
                logger.debug(process.env.BASE_DN)

                const client = ldap.createClient({
                    url: process.env.LDAP_URI || '',

                    // baseDN: process.env.BASE_DN || ''
                });

                client.on('error', (err) => {
                    if (err.code === 'ENOTFOUND') logger.critical("Cannot connect to LDAP instance !")
                    else logger.error('LDAP : ' + err.message);
                });

                let user = await ldapService.getUserForUID(client, username).catch(reason => {
                    logger.error("Could not get mail for uid " + username + " : ", reason)
                })

                if (!user) {
                    reject({message: "User not found !"})
                } else {
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
                            if (user) resolve(user)
                        }
                    })
                }
            })()
        })
    }
}
