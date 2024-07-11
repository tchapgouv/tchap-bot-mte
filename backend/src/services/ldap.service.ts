import ldap, {SearchOptions} from "ldapjs";
import logger from "../utils/logger.js";


export default {

    async getMailsForUIDs(usernames: string[]): Promise<{ userMailList: string[], userNotFoundList: string[] }> {

        logger.debug("getMailsForUIDs", usernames.length)

        let userMailList: string[] = []

        const client = ldap.createClient({
            url: process.env.LDAP_URI || ''
        });

        let userNotFoundList: string[] = []
        await Promise.all(usernames.map(async (username) => {
            await this.getMailPRForUID(client, username)
                .then(mail => userMailList.push(mail))
                .catch(_reason => {
                    userNotFoundList.push(username)
                })
        })).catch(reason => {
            logger.error("getMailsForUIDs : ", reason)
            throw (reason)
        })

        logger.debug("Mailing list : " + userMailList)
        return ({userMailList, userNotFoundList})
    },

    async getMailPRForUID(client: ldap.Client, username: string): Promise<string> {

        logger.debug("getMailPRForUID", username)

        let mailPR: string | undefined

        await this.getUserForUID(client, username).then((user: any) => {
            logger.debug("Main mail for user " + username + " = " + user.mailPR[0].toLowerCase())
            mailPR = (user.mailPR[0].toLowerCase())
        }).catch(reason => {
            logger.error("Could not get mail for uid " + username + " : ", reason)
            throw (reason)
        })

        if (!mailPR) throw ("MailPR not found for user : " + username)

        return mailPR
    },

    // await ldapService.getUsersWithBaseDn(ldap.createClient({url: process.env.LDAP_URI || ''}), "ou=GMCD,ou=DETN,ou=UNI,ou=DNUM,ou=SG,ou=AC,ou=melanie,ou=organisation,dc=equipement,dc=gouv,dc=fr", true).then(value => console.log("value"))
    async getUsersWithLdapRequest(client: ldap.Client, baseDn: string, recursively = false, filter: string = "(&(objectClass=mineqPerson))") {

        logger.debug("getUsersWithBaseDn", baseDn)

        const opts: SearchOptions = {
            attributes: ['uid', 'cn', 'mailPR', 'displayName'],
            filter,
            scope: recursively ? 'sub' : 'one'
        };

        logger.notice('LDAP : Search users in ' + baseDn)

        let userCount = 0;

        let users: any[] = []

        return new Promise((resolve, reject) => {

            (async () => {
                client.search(baseDn, opts, ((err, res) => {

                    res.on('searchRequest', (searchRequest) => {
                        logger.debug('LDAP : searchRequest: ', searchRequest.messageId);
                    });
                    res.on('searchReference', (referral) => {
                        logger.debug('LDAP : referral: ' + referral.uris.join());
                    });
                    res.on('error', (err) => {
                        logger.error('LDAP : error: ' + err.message);
                    });
                    res.on('end', (result) => {
                        logger.debug('LDAP : status: ' + result?.status);
                        if (userCount === 0) {
                            logger.warning('LDAP : no user found.')
                            reject('LDAP : no user found.')
                        }
                        resolve(users)
                    });

                    res.on('searchEntry', (entry) => {  // There was a match.

                        userCount++

                        let mappedUser: any = {}

                        mappedUser.dn = entry.pojo.objectName

                        for (const attribute in entry.pojo.attributes) {
                            mappedUser[entry.pojo.attributes[attribute].type] = entry.pojo.attributes[attribute].values
                        }
                        logger.debug('LDAP : User found : ', mappedUser)
                        users.push(mappedUser)
                    })
                }))
            })()
        })
    },

    async getUserForUID(client: ldap.Client, username: string) {

        logger.debug("getUserForUID", username)

        const opts: SearchOptions = {
            attributes: ['uid', 'cn', 'mail', 'mailPR', 'displayName'],
            filter: "(&(uid=" + username + "))",
            scope: 'sub'
        };

        logger.notice('LDAP : Search DN for ' + username)
        let userCount = 0;

        return new Promise((resolve, reject) => {

            (async () => {
                client.search(process.env.BASE_DN || '', opts, ((err, res) => {

                    res.on('searchRequest', (searchRequest) => {
                        logger.debug('LDAP : searchRequest: ', searchRequest.messageId);
                    });
                    res.on('searchReference', (referral) => {
                        logger.debug('LDAP : referral: ' + referral.uris.join());
                    });
                    res.on('error', (err) => {
                        logger.error('LDAP : error: ' + err.message);
                    });
                    res.on('end', (result) => {
                        logger.debug('LDAP : status: ' + result?.status);
                        if (userCount === 0) {
                            logger.alert('LDAP : ' + username + " : Not found.")
                            reject('LDAP : ' + username + " : Not found.")
                        }
                    });

                    res.on('searchEntry', (entry) => {  // There was a match.

                        userCount++

                        let mappedUser: any = {}

                        mappedUser.dn = entry.pojo.objectName

                        for (const attribute in entry.pojo.attributes) {
                            mappedUser[entry.pojo.attributes[attribute].type] = entry.pojo.attributes[attribute].values
                        }
                        logger.debug('LDAP : User found for username = ' + username + ' : ', mappedUser)
                        resolve(mappedUser)
                    })
                }))
            })()
        })
    }
}


