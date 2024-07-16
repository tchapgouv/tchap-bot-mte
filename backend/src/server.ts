import express from 'express';
import https from 'https';
import fs from 'fs';
import db from './models/index.js'
import userRouter from './routes/user.routes.js';
import botRoomRouter from './routes/bot.room.routes.js';
import botUserRouter from './routes/bot.user.routes.js';
import authRouter from './routes/auth.routes.js';
import cors from 'cors';
import logger from "./utils/logger.js";
import userService from "./services/user.service.js";
import webhookRouter from "./routes/webhook.routes.js";
import path from 'path'
import {fileURLToPath} from 'url';
import {syntaxErrorHandler} from "./requestHandlers/syntaxError.handler.js";
import swaggerUi from "swagger-ui-express"
import {specs} from "./swagger.config.js";
import crypto from "crypto";
import fileUpload from "express-fileupload";
import Crontab from "./Crontab.js";
import ldapService from "./services/ldap.service.js";
import ldap from "ldapjs";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
const app = express()
const vuePath = path.join(__dirname, 'static')

logger.notice("Static path : ", vuePath)

const corsOptions = {origin: true, credentials: true};
app.use(cors(corsOptions));

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs)
);

// parse requests of content-type - application/json
app.use(express.json({limit: '1mb'}));
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({extended: true}));

app.use(express.static(vuePath));

app.use(fileUpload({
    abortOnLimit: true,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    debug: true,
    logger: {
        log: (msg) => {
            logger.debug(msg)
        }
    }
}))

app.use(webhookRouter);
app.use(userRouter);
app.use(authRouter);
app.use(botRoomRouter);
app.use(botUserRouter);

app.use(syntaxErrorHandler)

db.sync()
    .then(() => {
        logger.notice("Synced db.");

        userService.create("thomas.bouchardon").catch((_reason: any) => logger.error("Could not create user !"))
        userService.create("hugo.tourbez.i").catch((_reason: any) => logger.error("Could not create user !"))

    })
    .catch((err: any) => {
        logger.error("Failed to sync db: " + err.message);
    });

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
        logger.notice(`Server is running https on port ${PORT}.`);
    });

} catch (error) {

    logger.error("Error during https startup !")
    logger.error(error)
    logger.notice("Starting express in http mod.")

    app.listen(PORT, () => {
        logger.notice(`Server is running http on port ${PORT}.`);
    });
}
const currentToken = crypto.createHash('sha512').update(new Date().toLocaleDateString("fr-FR") + "-" + process.env.JWT_KEY).digest('hex')
logger.info("Current Time Based Token : ",
    currentToken,
    currentToken.substring(0, 15) + "***************" + currentToken.substring(currentToken.length - 15, currentToken.length),
    "Based on : ",
    new Date().toLocaleDateString("fr-FR") + "-JWT_KEY")

const cron = new Crontab()
cron.init()
