import logger from "../../utils/logger.js";
import * as sdk from "matrix-js-sdk";
import {ClientEvent, EventType, MatrixClient, MatrixEvent, RoomEvent, RoomMemberEvent} from "matrix-js-sdk";
import {sendMessage} from "./helper.js";
import {RequestInit} from "node-fetch";
import fetchWithError from "../../utils/fetchWithError.js";
import {GMCD_INFRA_ROOM_ID} from "./config.js";
import {Brain} from "./Brain.js";
import {RoomMember} from "matrix-js-sdk/lib/models/room-member.js";
import configGmcd from "../gmcd/config.js";
import metricService, {MetricLabel} from "../../services/metric.service.js";

export class Bot {

    client: MatrixClient;
    brain: Brain = new Brain()
    private readonly parseMessage: (arg0: MatrixClient, arg1: MatrixEvent, arg2: Brain, arg3: { message: string, formatted_message: string, sender: RoomMember; botId: string; roomId: string }) => void;
    private readonly parseMessageToSelf: (arg0: MatrixClient, arg1: MatrixEvent, arg2: Brain, arg3: { message: string, formatted_message: string, sender: RoomMember; botId: string; roomId: string }) => void;

    ids_token: { token: string, valid_until: Date } | undefined

    constructor(opts: {
                    baseUrl: string,
                    accessToken: string,
                    userId: string,
                    deviceId: string,
                    idBaseUrl: string
                },
                parseMessageToSelf: (arg0: MatrixClient, arg1: MatrixEvent, arg2: Brain, arg3: { message: string, formatted_message: string, sender: RoomMember; botId: string; roomId: string }) => void,
                parseMessage: (arg0: MatrixClient, arg1: MatrixEvent, arg2: Brain, arg3: { message: string, formatted_message: string, sender: RoomMember; botId: string; roomId: string }) => void) {

        const getIST = () => {
            return this.getIdentityServerToken()
        }

        this.client = sdk.createClient({
            baseUrl: opts.baseUrl,
            accessToken: opts.accessToken,
            userId: opts.userId,
            deviceId: opts.deviceId,
            idBaseUrl: opts.idBaseUrl,
            identityServer: {
                getAccessToken(): Promise<string | null> {
                    return getIST()
                }
            }
        });

        this.parseMessage = parseMessage
        this.parseMessageToSelf = parseMessageToSelf

        this.init()
    }

    private init() {

        this.client.usingExternalCrypto = true

        this.client.on(ClientEvent.Sync, async (state, _prevState, _res) => {
            if (state === "PREPARED") {
                this.onPrepared(this.client)
            } else {
                // logger.debug(state);
            }
        });

// Listen for low-level MatrixEvents
        this.client.on(ClientEvent.Event, (event) => {
            logger.debug(event.getType());
        });

// Listen for typing changes
        this.client.on(RoomMemberEvent.Typing, (_event, member) => {
            if (member.typing) {
                logger.debug(member.name + " is typing...");
            } else {
                logger.debug(member.name + " stopped typing.");
            }
        });

// Auto join rooms
        this.client.on(RoomMemberEvent.Membership, (_event, member) => {

            if (member.membership === "invite" && member.userId === this.client.getUserId() &&
                member.roomId !== '!zUSLZOXAyGnmzVpaVM:agent.dev-durable.tchap.gouv.fr') {
                this.client.joinRoom(member.roomId).then(() => {
                    logger.notice("Auto-joined %s", member.roomId);
                }).catch(reason => logger.error("Error joining room ! ", member.roomId, reason));
            }
        });

// Listen to messages
        this.client.on(RoomEvent.Timeline, (event, _room, _toStartOfTimeline) => {
            logger.debug("-------------------------------------------------------")
            logger.debug("Event type : ", event.getType())
            logger.debug("Event :", event);
            logger.debug("Event content :", event.event.content)

            const botId = this.client.getUserId()

            if (event.getType() === EventType.RoomMessage && botId) {

                if (event.sender?.userId === botId) {
                    logger.info("Message is mine")
                    return
                }

                const botName = this.client.getUser(botId)?.displayName?.replace(/ \[.*/, "")
                const userIds = event.getContent()["m.mentions"]?.user_ids;

                let isSelfMentioned = userIds && userIds.indexOf(botId) > -1;
                const body = event.event.content?.formatted_body ? event.event.content?.formatted_body : event.event.content?.body
                if (!isSelfMentioned && botName) isSelfMentioned = body.toLowerCase().replace(/> .*?\n/g, '').includes("@" + botName.toLowerCase())

                logger.debug("Is self mentioned ? ", isSelfMentioned)
                logger.debug("sender = ", event.getSender())
                let isNewMessage = undefined
                if (event.event.unsigned?.age) {
                    logger.debug("event.event.unsigned = ", event.event.unsigned)
                    logger.debug("event age = ", event.event.unsigned?.age)
                    isNewMessage = event.event.unsigned?.age && event.event.unsigned.age < 20 * 1000
                } else if (event.event.origin_server_ts) {
                    logger.debug("event.event.origin_server_ts = ", event.event.origin_server_ts)
                    isNewMessage = new Date().getTime() - event.event.origin_server_ts < 20 * 1000
                }
                logger.debug("isNewMessage ? ", isNewMessage)

                if (isNewMessage) {

                    const message: string = event.event.content?.body.toLowerCase() || ""
                    const formatted_message: string = event.event.content?.formatted_body.toLowerCase() || ""
                    const roomId = event.event.room_id

                    if (roomId && event.sender && this.client.getUserId()) {

                        const data: { message: string, formatted_message: string, sender: RoomMember; botId: string; roomId: string } = {
                            message,
                            formatted_message,
                            sender: event.sender,
                            roomId,
                            botId: this.client.getUserId() || configGmcd.userId
                        }

                        if (isSelfMentioned) {

                            metricService.createOrIncrease(
                                {
                                    name: "bot_mentioned",
                                    labels: [
                                        new MetricLabel("bot_id", this.client.getUserId() || configGmcd.userId),
                                    ]
                                })

                            logger.debug("Parsing Message To Self", this.client.getUserId())
                            this.parseMessageToSelf(this.client, event, this.brain, data)
                        } else {

                            logger.debug("Parsing Message", this.client.getUserId())
                            this.parseMessage(this.client, event, this.brain, data)
                        }
                    }
                }
            }
        });
    }

    private isTokenValidForTheNextNthMinutes(ids_token: { token: string, valid_until: Date }, minutes: number) {
        logger.debug("is " + ids_token.valid_until.getTime() + " > " + ((new Date()).getTime() + (minutes * 60 * 1000)) + " ?")
        return ids_token.valid_until.getTime() > ((new Date()).getTime() + (minutes * 60 * 1000))
    }

    getIdentityServerToken(): Promise<string | null> {

        return new Promise((resolve, _reject) => {

            if (this.ids_token?.token && this.isTokenValidForTheNextNthMinutes(this.ids_token, 5)) {
                logger.notice("Token still valid : ", this.ids_token)
                resolve(this.ids_token.token)
                return
            }

            this.client.getOpenIdToken().then(openIdToken => {
                logger.notice("openIdToken : ", openIdToken)
                const url: string = process.env.IDENTITY_SERVER_URL + "/_matrix/identity/v2/account/register"
                const requestInit: RequestInit = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(openIdToken)
                }
                const fetchOpts = {
                    requestInit: requestInit,
                    proxify: true,
                    timeout: 15000
                }
                fetchWithError(url, fetchOpts)
                    .then((response: Response) => response.json())
                    .then((data: any) => {
                        logger.notice("fetch : " + url, data)
                        this.ids_token = {
                            token: data.access_token,
                            valid_until: new Date((new Date()).getTime() + (60 * 60 * 1000))
                        }
                        resolve(data.access_token)
                    })
                    .catch(reason => logger.error("fetch : " + url, reason))

            }).catch(reason => {
                logger.error("getOpenIdToken : ", reason)
                resolve(null)
            })

        })
    }

    private onPrepared(client: MatrixClient) {
        logger.debug("prepared");

        client.publicRooms().then((data) => {
            logger.debug("Public Rooms: %s", JSON.stringify(data));
        }).catch(e => logger.error(e))

        const start = ['Hallo', 'Bonjour', 'Salut', 'Hello', 'Hej', 'Hola', 'Buongiorno', 'God morgon', 'Dzień dobry', 'Dobrý den', 'Hyvää huomenta'];
        const startLength = start.length
        const end = ['.', ' !', ', me revoilà.', '. Je viens de redémarrer ¯\\_(ツ)_/¯', ', encore =)'];
        const endLength = end.length

        metricService.createOrIncrease(
            {
                name: "bot_restart",
                labels: [
                    new MetricLabel("bot_id", client.getUserId() + ""),
                ]
            })

        sendMessage(client, GMCD_INFRA_ROOM_ID, "(Prepared) " + start[Math.floor(Math.random() * startLength)] + end[Math.floor(Math.random() * endLength)])
    }
}
