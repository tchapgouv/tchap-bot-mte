import olm from "olm";
import logger from "../../utils/logger.js";
import client from "./init.js";

// noinspection JSUnresolvedReference
global.Olm = olm

if (!process.env.BOTLESS) {
    await client.startClient().catch((e: any) => logger.error(e))
}
export default client;
