import olm from "olm";
import logger from "../../utils/logger.js";
import {parseMessage, parseMessageToSelf} from "./answer.js";
import {Bot} from "../common/Bot.js";
import config from "./config.js";
import {startClientOpts} from "../common/config.js";

// noinspection JSUnresolvedReference
global.Olm = olm

const bot = new Bot(config,
    parseMessageToSelf,
    parseMessage)

if (!process.env.BOTLESS) {
    await bot.client.startClient(startClientOpts).catch((e: any) => logger.error(e))
}
export default bot;
