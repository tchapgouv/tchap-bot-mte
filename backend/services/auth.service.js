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
      console.log(err)
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

  logger.debug("User found : ", user)

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

    console.log("Search DN for " + username)
    let userCount = 0;

    client.search(process.env.BASE_DN, opts, (err, res) => {

      res.on('searchRequest', (searchRequest) => {
        console.log('searchRequest: ', searchRequest.messageId);
      });
      res.on('searchReference', (referral) => {
        console.log('referral: ' + referral.uris.join());
      });
      res.on('error', (err) => {
        console.error('error: ' + err.message);
      });
      res.on('end', (result) => {
        console.log('status: ' + result.status);
        if (userCount === 0) reject({message: "Not found."})
      });

      res.on('searchEntry', (entry) => {  // There was a match.

        console.log('searchEntry: ');
        userCount++

        // console.log('entry: ' + JSON.stringify(entry.pojo));
        const user = {}
        user.dn = entry.pojo.objectName

        for (const attribute in entry.pojo.attributes) {
          user[entry.pojo.attributes[attribute].type] = entry.pojo.attributes[attribute].values
        }

        console.log(user)
        console.log("Binding " + user.dn)
        client.bind(user.dn, password, (error, _response) => {

          // console.log(response)

          if (error) {

            client.unbind(() => {
              console.log('Disconnecting.');
            });
            console.error("LDAP binding failed.")
            reject({message: error.lde_message})

          } else {

            console.log("Logged in")
            resolve(user)

          }
        })
      })
    })
  })
}
