import ldap, {SearchOptions} from "ldapjs";
import logger from "../utils/logger.js";


const AGENT_ATTRIBUTES = ['uid', 'cn', 'mail', 'mailPR', 'displayName', 'objectClass']

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
    async getUsersWithLdapRequest(client: ldap.Client, baseDn: string, recursively = false, filter: string = "(&(objectClass=mineqPerson))"): Promise<Agent[]> {

        logger.debug("getUsersWithLdapRequest", baseDn, filter, recursively)

        const opts: SearchOptions = {
            attributes: AGENT_ATTRIBUTES,
            filter,
            scope: recursively ? 'sub' : 'one'
        };

        logger.notice('LDAP : Search users in ' + baseDn)

        let userCount = 0;

        let users: Agent[] = []

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

                        let agent: any = Agent.fromPojo(entry.pojo)
                        logger.debug('LDAP : User found : ', agent)
                        users.push(agent)
                    })
                }))
            })()
        })
    },

    async getUserForUID(client: ldap.Client, username: string) {

        logger.debug("getUserForUID", username)

        const opts: SearchOptions = {
            attributes: AGENT_ATTRIBUTES,
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

                        let mappedUser: Agent = Agent.fromPojo(entry.pojo)
                        logger.debug('LDAP : User found for username = ' + username + ' : ', mappedUser)
                        resolve(mappedUser)
                    })
                }))
            })()
        })
    },
    getUsersWithLdapMailingList(ldapClient: ldap.Client, mail: string): Promise<Agent[]> {

        return new Promise((resolve, reject) => {

            (async () => {

                let filter: string

                filter = "(|"
                for (const m of mail.split(";")) {
                    filter += "(mail=" + m + ")"
                }
                filter += ")"

                logger.debug("filter", filter)

                let opts: SearchOptions = {
                    attributes: ["mineqMelMembres"],
                    filter: filter,
                    scope: 'sub'
                };

                const mailList = await new Promise<string[]>((resolve, reject) => {

                    let listCount: number = 0
                    let mailList: string[] = []

                    ldapClient.search(process.env.BASE_DN || '', opts, ((err, res) => {

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
                            if (listCount === 0) {
                                logger.alert('LDAP : ' + mail + " : Not found.")
                                reject('LDAP : ' + mail + " : Not found.")
                            }
                            resolve(mailList)
                        });

                        res.on('searchEntry', (entry) => {  // There was a match.

                            const pojo: any = entry.pojo

                            listCount++
                            const membres = Agent.getPojoValue(pojo, "mineqMelMembres")

                            mailList = mailList.concat(membres)
                        })
                    }))
                })

                if (mailList.length === 0) {

                    reject("Mailing list " + mail + "has no members.")

                } else {

                    logger.debug(mailList)
                    logger.debug(mailList.length)

                    let filter = "(|"
                    for (const mail of mailList) {
                        filter += "(mail=" + mail + ")"
                    }
                    filter += ")"

                    logger.debug("filter", filter)

                    let realAgents: Agent[] = []
                    let nestedSearch: Promise<Agent[]>[] = []

                    await this.getUsersWithLdapRequest(ldapClient, process.env.BASE_DN || '', true, filter)
                        .then(agents => {
                            for (const agent of agents) {
                                if (agent.objectClass.some(value => value === "mineqMelListe")) {
                                    nestedSearch.push(this.getUsersWithLdapMailingList(ldapClient, agent.mailPR).then(value => realAgents = realAgents.concat(value)))
                                } else realAgents.push(agent)
                            }
                        })
                        .catch(_reason => reject("Error while searching for users with ldap mailing list."))

                    await Promise.all(nestedSearch).then(value => {
                        for (const valueElement of value) {
                            realAgents = realAgents.concat(valueElement)
                        }
                    })

                    resolve(realAgents)
                }
            })()
        })
    }
}


export class Agent {

    uid: string | undefined
    dn: string
    cn: string
    mailPR: string
    mail: string[]
    objectClass: string[]
    displayName: string

    constructor(data: {
        uid: string | undefined,
        dn: string,
        cn: string,
        mailPR: string,
        mail: string[],
        objectClass: string[],
        displayName: string
    }) {
        this.uid = data.uid;
        this.dn = data.dn;
        this.cn = data.cn;
        this.objectClass = data.objectClass;
        this.mailPR = data.mailPR;
        this.mail = data.mail;
        this.displayName = data.displayName;
    }

    static fromPojo(pojo: any): Agent {

        const uids = this.getPojoValue(pojo, "uid")

        return new Agent(
            {
                dn: pojo.objectName,
                objectClass: this.getPojoValue(pojo, "objectClass"),
                uid: (uids && uids[0]) ? uids[0] : undefined,
                cn: this.getPojoValue(pojo, "cn")[0],
                mailPR: this.getPojoValue(pojo, "mailPR")[0],
                mail: this.getPojoValue(pojo, "mail"),
                displayName: this.getPojoValue(pojo, "displayName")[0],
            }
        )
    }

    static dumpPojo(pojo: any) {
        const mappedAgent: any = {}
        for (const attribute in pojo.attributes) {
            mappedAgent[pojo.attributes[attribute].type] = pojo.attributes[attribute].values
        }
        logger.debug(mappedAgent)
    }

    static getPojoValue(pojo: any, attribute: string): string[] {
        return pojo.attributes.filter((attr: { type: string, values: any }) => attr.type === attribute)[0]?.values
    }
}



