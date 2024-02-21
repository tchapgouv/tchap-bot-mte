import jwt from 'jsonwebtoken';
import ldap from "ldapjs"
import db from "../models/index.js";
import logger from "../utils/logger.js";

const User = db.user;

export async function getAllUsers () {

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

export async function verifyJwt (token) {

  logger.debug(">>>> verifyJwt")

  // decode cookie and get user id
  const decoded = decodeToken(token)

  logger.debug("Decoded token : ", decoded)

  let user
  // find the user
  await getAllUsers().then((users) => {

    user = users.find(u => u.username === decoded.uid[0]);
  })

  logger.notice("User found : ", user)

  return user
}

function decodeToken (token) {

  return jwt.verify(token, process.env.JWT_KEY);

}

export async function getUserFromToken (token) {

  // decode cookie and get user id
  const decoded = decodeToken(token)
  const userId = decoded.id;

  await getAllUsers().then((users) => {
    return users.find(u => u.uid === userId)
  })
}

export async function ldapAuth (username, password) {

  logger.debug(process.env.LDAP_URI)
  logger.debug(process.env.BASE_DN)

  const client = ldap.createClient({
    url: process.env.LDAP_URI,
    baseDN: process.env.BASE_DN
  });


  return new Promise((resolve, reject) => {

    const opts = {
      attributes: ['uid', 'cn', 'mail'],
      filter: "(&(uid=" + username + "))",
      scope: 'sub'
    };

    logger.notice("Search DN for " + username)
    let userCount = 0;

    client.search(process.env.BASE_DN, opts, (err, res) => {

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
        logger.debug('status: ' + result.status);
        if (userCount === 0) {
          logger.alert(username + " : Not found.")
          reject({message: "Not found."})
        }
      });

      res.on('searchEntry', (entry) => {  // There was a match.

        logger.debug('searchEntry: ');
        userCount++

        // logger.debug('entry: ' + JSON.stringify(entry.pojo));
        const user = {}
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
            reject({message: error.lde_message})

          } else {

            logger.notice(username + " : Logged in")
            resolve(user)

          }
        })
      })
    })
  })
}
