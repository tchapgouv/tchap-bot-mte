import jwt, {JwtPayload} from 'jsonwebtoken';
import ldap, {SearchOptions} from "ldapjs"
import logger from "../utils/logger.js";
import {User} from "../models/user.model.js";


export async function getAllUsers() {

    return await User.findAll()
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


    return new Promise((resolve, reject) => {

        const opts: SearchOptions = {
            attributes: ['uid', 'cn', 'mail'],
            filter: "(&(uid=" + username + "))",
            scope: 'sub'
        };

        logger.notice("Search DN for " + username)
        let userCount = 0;

        client.search(process.env.BASE_DN || '', opts, ((err, res) => {

            res.on('searchRequest', (searchRequest) => {
                logger.debug('searchRequest: ', searchRequest.messageId);
            });
            res.on('searchReference', (referral) => {
                logger.debug('referral: ' + referral.uris.join());
            });
            res.on('error', (err) => {
                console.error('error: ' + err.message);
            });
            res.on('end', (result) => {
                logger.debug('status: ' + result?.status);
                if (userCount === 0) {
                    logger.alert(username + " : Not found.")
                    reject({message: "Not found."})
                }
            });

            res.on('searchEntry', (entry) => {  // There was a match.

                logger.debug('searchEntry: ');
                userCount++

                // logger.debug('entry: ' + JSON.stringify(entry.pojo));
                const user: any = {}
                user.dn = entry.pojo.objectName

                for (const attribute in entry.pojo.attributes) {
                    user[entry.pojo.attributes[attribute].type] = entry.pojo.attributes[attribute].values
                }

                logger.debug(user)
                logger.debug("Binding " + user.dn)
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
        }))
    })
}
