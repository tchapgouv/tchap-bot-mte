import {MatrixClient} from "matrix-js-sdk";


/**
 * --help
 * command : extract
 * return : Je génère une extraction des messages sur une semaine
 */
export function extractIfAsked(client: MatrixClient, roomId: string, body: string) {

    const regex: RegExp = /.*(norris( |$)).*/i

    if (regex.test(body)) {

        client.getRoom(roomId)?.getTimelineSets()

        // sendMessage(client, roomId, data.joke)
    }
}
