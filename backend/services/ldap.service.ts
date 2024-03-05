import ldap, {SearchOptions} from "ldapjs";
import logger from "../utils/logger.js";


export async function getMailsForUIDs(usernames: string[]) {

    let userMailList: string[] = []

    const client = ldap.createClient({
        url: process.env.LDAP_URI || ''
    });

    await Promise.all(usernames.map(async (username) => {
        await getMailForUID(client, username).then(mail => userMailList.push(mail)).catch(reason => logger.error("getMailsForUIDs : ", reason))
    })).catch(reason => logger.error("getMailsForUIDs : ", reason))

    logger.debug("Mailing list : " + userMailList)
    return userMailList
}

export async function getMailForUID(client: ldap.Client, username: string) {

    let mail: string = ""
    await getUserForUID(client, username).then((user: any) => {

        const regexpDevDur = new RegExp(username + '@developpement.*')
        const regexpICarre = new RegExp(username + '@i-carre.*')
        const regexpAt = new RegExp(username + '@.*')
        for (const currentMail of user.mail) {
            // Mail en dev dur > tous !
            if (regexpDevDur.test(currentMail)) {
                mail = currentMail
                break;
            }
            // Mail en i-carre OK en attendant mieux
            if (regexpICarre.test(currentMail)) mail = currentMail
            // N'importe quel mail si aucun jusqu'à présent
            if (!mail && regexpAt.test(currentMail)) mail = currentMail
        }
        if (!mail) mail = user.mail[0]
    }).catch(reason => logger.error("getMailForUID : ", reason))

    logger.debug("Main mail for user " + username + " = " + mail)
    return mail
}

export async function getUserForUID(client: ldap.Client, username: string) {

    const opts: SearchOptions = {
        attributes: ['uid', 'cn', 'mail'],
        filter: "(&(uid=" + username + "))",
        scope: 'sub'
    };

    logger.notice('LDAP : Search DN for ' + username)
    let userCount = 0;

    const user: any = {}

    await new Promise((_resolve, _reject) => {

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
                    // reject({message: "Not found."})
                }
            });

            res.on('searchEntry', (entry) => {  // There was a match.

                userCount++

                user.dn = entry.pojo.objectName

                for (const attribute in entry.pojo.attributes) {
                    user[entry.pojo.attributes[attribute].type] = entry.pojo.attributes[attribute].values
                }
                logger.debug('LDAP : User found for username = ' + username + ' : ', user)
            })
        }))
    })

    return user
}
