import express from 'express';
import https from 'https';
import fs from 'fs';
import db from './models/index.js'
import webhookApi from './routes/webhook.routes.js';
import userApi from './routes/user.routes.js';
import authApi from './routes/auth.routes.js';
import cors from 'cors';
import logger from "./utils/logger.js";

const app = express()
const vuePath = "./static"

const corsOptions = {origin: true, credentials: true};
app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({extended: true}));

app.use(express.static(vuePath));

app.use(webhookApi);
app.use(userApi);
app.use(authApi);

await db.sequelize.sync()
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

await db.user.findOrCreate({
  where: {
    username: 'thomas.bouchardon'
  },
  defaults: {
    username: 'thomas.bouchardon'
  }
})

// simple route
app.get("/api", (req, res) => {
  res.json({message: "Welcome to the bot webhook management API."});
});

const PORT = process.env.PORT || 8085;

try {

  logger.info("Starting express in https mod.")

  const privateKey = fs.readFileSync('/etc/certs/tchap-bot.mel.edcs.fr-key.pem', 'utf8');
  const certificate = fs.readFileSync('/etc/certs/tchap-bot.mel.edcs.fr-cert.pem', 'utf8');

  const credentials = {key: privateKey, cert: certificate};

  const httpsServer = https.createServer(credentials, app);

  httpsServer.listen(PORT, () => {
    console.log(`Server is running https on port ${PORT}.`);
  });

} catch (error) {

  logger.error("Error during https startup !")
  logger.error(error)
  logger.info("Starting express in http mod.")

  app.listen(PORT, () => {
    logger.info(`Server is running http on port ${PORT}.`);
  });
}

