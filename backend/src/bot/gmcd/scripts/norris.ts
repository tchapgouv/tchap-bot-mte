import fetchWithError from "../../../utils/fetchWithError.js";
import {MatrixClient} from "matrix-js-sdk";
import {sendMessage} from "../helper.js";

export function norrisIfAsked(client: MatrixClient, roomId: string, body: string) {

    const regex: RegExp = /.*(norris( |$)).*/i

    if (regex.test(body)) {
        fetchWithError('https://chuckn.neant.be/api/rand', {proxify: true})
            .then(response => response.json())
            .then(data => {
                sendMessage(client, roomId, data.joke)
            })
            .catch(reason => sendMessage(client, roomId, 'Not even Chuck Norris can deal with this one: ' + reason));
    }
}
