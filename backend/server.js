import express from 'express';
import db from './models/index.js'
import webhookApi from './routes/webhook.routes.js';
// import bot from './bot.js';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import {getUserFromToken, ldapAuth, users, verifyToken} from "./auth.js";
import {findOneWithWebhook} from "./controllers/webhook.controller.js";


const app = express()
const vuePath = "./static"

// app.use(cors())

const corsOptions = {origin: true, credentials: true};
app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({extended: true}));

app.use(express.static(vuePath));

app.use(webhookApi);

db.sequelize.sync()
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

// simple route
app.get("/", (req, res) => {
  res.json({message: "Welcome to the bot webhook management API."});
});
app.get("/user", verifyToken, (req, res) => {

  // get cookie from header with name token
  let token = req.headers.cookie.split(';').find(c => {
    return c.trim().startsWith('user_token=')
  });
  token = token.split('=')[1];

  res.json({user: getUserFromToken(token)})
});


app.post('/auth', (req, res) => {

  const {username, password} = req.body;
  console.log(username, password)

  users().then((data) => {
    console.log(data)

    if (!data) {
      res.status(401)
        .json({
          message: "Invalid credentials",
        });
    } else {

      const user = data.find(u => {
        return u.username === username //&& u.password === password
      });

      console.log(user)

      if (!user) {
        res.status(401)
          .json({
            message: "Invalid credentials",
          });
      } else {

        const token = jwt.sign({id: user.id, username: user.username}, process.env.JWT_KEY);

        // set the cookie
        res.setHeader('Set-Cookie', `user_token=${token}; HttpOnly;`);
        res.json({user, token});

      }
    }
  })
});


app.post('/logout', (req, res) => {

  res.setHeader('Set-Cookie', `user_token=; HttpOnly;`);
  res.json({success: 'OK'});
});


app.post("/post/:webhook", verifyToken, (req, res) => {

  findOneWithWebhook(req, res).then(data => {

    const room_id = data.dataValues.room_id

    bot.sendTextMessage(room_id, req.body.message + " (webhook=" + req.params.webhook + ")").then(() => {
      res.json({message: "Message sent"})
    }).catch(e => console.error(e))

  })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving webhook."
      });
    });
})

// set port, listen for requests
const PORT = process.env.PORT || 8085;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});


ldapAuth("thomas.bouchardon", "ME.gandalF;789").catch(err => console.log(err))
