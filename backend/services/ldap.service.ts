import ldap, {SearchOptions} from "ldapjs";
import logger from "../utils/logger.js";


export async function getMailsForUIDs(usernames: string[]) {

    let userMailList: string[] = []

    const client = ldap.createClient({
        url: process.env.LDAP_URI || ''
    });

    await Promise.all(usernames.map(async (username) => {
        await getMailForUID(client, username).then(mail => userMailList.push(mail))
    }))

    return userMailList
}

export async function getMailForUID(client: ldap.Client, username: string) {

    let mail: string = ""
    await getUserForUID(client, username).then((user: any) => (mail = user.dn))
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

                user.dn = entry.pojo.objectName

                for (const attribute in entry.pojo.attributes) {
                    user[entry.pojo.attributes[attribute].type] = entry.pojo.attributes[attribute].values
                }
                logger.debug('LDAP : ', user)
            })
        }))
    })

    return user
}
