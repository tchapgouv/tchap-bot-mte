import jwt from 'jsonwebtoken';
import db from "./models/index.js";
import ldap from "ldapjs"

const User = db.user;

export async function users () {
  return await User.findAll()
    .then(data => {
      const userList = data.map((value) => {
        return {
          id: value.dataValues.id, username: value.dataValues.username
        }
      })
      return userList
    })
    .catch(err => {
      console.log(err)
    });
}

export async function verifyToken (req, res, next) {

  if (!req.headers.cookie) return res.status(401).json({message: 'Unauthenticated (Missing Cookie)'});

  // get cookie from header with name token
  let token = req.headers.cookie.split(';').find(c => {
    return c.trim().startsWith('user_token=')
  });

  if (!token) return res.status(401).json({message: 'Unauthenticated (Missing Token)'});

  token = token.split('=')[1];

  if (!token) return res.status(401).json({message: 'Unauthenticated (Empty Token)'});

  // decode cookie and get user id
  const decoded = jwt.verify(token, process.env.JWT_KEY);
  const userId = decoded.id;

  // find the user
  await users().then((users) => {
    const user = users.find(u => u.id === userId);

    // console.log(users)
    // console.log(user)
    // console.log(userId)
    if (!user) return res.status(401).json({message: 'Unauthenticated (User not found)'});

    next()
  })
}

export async function getUserFromToken (token) {

  // decode cookie and get user id
  const decoded = jwt.verify(token, process.env.JWT_KEY);
  const userId = decoded.id;

  await users().then((users) => {
    const user = users.find(u => u.id === userId);
    user.password = "*****"

    return user
  })
}

export async function ldapAuth (username, password) {
  const client = ldap.createClient({
    url: process.env.LDAP_URI,
  });

  return new Promise((resolve, reject) => {

    console.log("before bind")
    client.bind(username, password, (error) => {

      if (error) {

        client.unbind(() => {
          console.log('Disconnecting.');
        });
        console.error("LDAP binding failed.")
        reject({message: error})

      } else {

        console.log("Logged in")

        const opts = {
          // attributes: ['uid', 'dn', 'cn', 'mail'],
          attributes: ['uid'],
          filter: `&${filter}('uid'=${username})`,
          scope: 'sub'
        };

        console.log("before search")

        client.search(process.env.BASE_DN, opts, (err, res) => {

          res.on('searchEntry', (entry) => {  // There was a match.

            resolve({
              username: entry.object.uid,
              dn: entry.object.dn,
              cn: entry.object.cn,
              mail: entry.object.mail,
            })
          });

        })
      }
    })
  })
}
