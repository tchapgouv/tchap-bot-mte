import fetchWithError from "../../../utils/fetchWithError.js";
import {MatrixClient} from "matrix-js-sdk";
import {sendMessage} from "../helper.js";


/**
 * @help
 * command : norris
 * return : quand j’entends parler de Chuck, je propose une blague 😁
 */
export function norrisIfAsked(client: MatrixClient, roomId: string, body: string) {

    const regex: RegExp = /.*(norris( |$)).*/i

    if (regex.test(body)) {
        fetchWithError('https://chuckn.neant.be/api/rand', {proxify: true})
            .then(response => response.json())
            .then(data => {
                sendMessage(client, roomId, data.joke)
            })
            .catch(reason => sendMessage(client, roomId, JSON.stringify('Même Chuck Norris ne peut pas gérer celle là 😠 : ' + reason)));
    }
}
