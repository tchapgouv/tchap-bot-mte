import {RoomMember} from "matrix-js-sdk/lib/models/room-member.js";

export class BotMessageData {
    raw_message: string
    message: string
    formatted_message: string
    sender: RoomMember
    botId: string
    roomId: string

    constructor(raw_message: string, message: string, formatted_message: string, sender: RoomMember, botId: string, roomId: string) {
        this.raw_message = raw_message;
        this.message = message;
        this.formatted_message = formatted_message;
        this.sender = sender;
        this.botId = botId;
        this.roomId = roomId;
    }
}
