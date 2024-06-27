import fetchWithError from "../../../utils/fetchWithError.js";
import {MatrixClient} from "matrix-js-sdk";
import {sendMessage} from "../../common/helper.js";
import {logger} from "matrix-js-sdk/lib/logger.js";


export function ollama(client: MatrixClient, roomId: string, sender: any, body: string) {

    const regex: RegExp = /.*(ollama( |$)).*/i

    if (regex.test(body)) {

        client.sendTyping(roomId, true, 30 * 1000)

        fetchWithError('https://Ollama.gmcd-runner01.eco4.cloud.e2.rie.gouv.fr/api/generate',
            {
                proxify: true,
                requestInit: {
                    method: "POST", // *GET, POST, PUT, DELETE, etc.
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        "model": "llama3",
                        "prompt": body.replace(/ollama /ig, ""),
                        "context": [128006, 882, 128007, 271, 82681, 11, 51223, 3595, 41091, 44093, 665, 55467, 13, 44172, 1208, 9904, 46932, 5048, 665, 46932, 519, 3625, 908, 729, 409, 85722, 9517, 66, 16921, 37622, 934, 8839, 1081, 27462, 1370, 1208, 27584, 9148, 483, 551, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 44829, 19266, 3595, 3869, 11083, 4860, 665, 513, 3122, 519, 1765, 20662, 9904, 13, 4275, 51625, 1082, 6502, 1744, 9964, 1208, 41380, 7010, 51309, 9517, 23475, 13, 128009, 128006, 78191, 128007, 271, 82681, 25782, 30854, 36731, 550, 49530, 3869, 9189, 75871, 265, 665, 55467, 11, 665, 42587, 519, 1208, 9904, 409, 426, 17946, 22299, 91558, 16271, 13, 51473, 89, 26317, 4860, 1880, 4864, 91507, 757, 3122, 261, 1765, 3625, 44827, 81994, 552, 5019, 9189, 75871, 265, 382, 2232, 17771, 54312, 1744, 9189, 55162, 41881, 47929, 949, 128009],
                        "stream": false
                    })
                }
            }
        )
            .then(response => response.json())
            .then(data => {
                client.sendTyping(roomId, false, 30 * 1000)
                sendMessage(client, roomId, data.response)
            })
            .catch(reason => {
                logger.error("Ollama error : ", reason)
                client.sendTyping(roomId, false, 30 * 1000)
                sendMessage(client, roomId, `Je crois avoir un problème d'accès à mes neurones 😶‍🌫️.`)
            });

        return true
    }
    return false
}
