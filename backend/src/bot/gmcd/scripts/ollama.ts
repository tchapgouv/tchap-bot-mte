import fetchWithError from "../../../utils/fetchWithError.js";
import {MatrixClient} from "matrix-js-sdk";
import {sendMessage} from "../../common/helper.js";
import logger from "../../../utils/logger.js";

/**
 * Initialisation du contexte de réponse. Récupérer body.context :
 * curl http://ollama:11434/api/generate -d '{ "model": "llama3", "prompt": "Bonjour. Répond toujours en français. Ton nom est Bot-GMCD. Lis la documentation suivante en suivant les liens de manière récursive tant qu''ils commencent par la même racine : https://fabrique-numerique.gitbook.io/bnum puis répond à mes questions en se basant sur cette documentation. Ne précise pas que tu lis la documentation dans tes réponses. Si tu fais référence à la documentation dans ta réponse, donne un lien vers la page que tu as utilisé à la fin de ta réponse.", "stream": false }'
 */


export function ollama(client: MatrixClient, roomId: string, sender: any, body: string) {

    const regex: RegExp = /.*(ollama( |$)).*/i

    if (regex.test(body)) {

        client.sendTyping(roomId, true, 30 * 1000)

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
        fetchWithError('https://Ollama.gmcd-runner01.eco4.cloud.e2.rie.gouv.fr/api/generate',
            {
                proxify: true,
                timeout: 30 * 1000,
                requestInit: {
                    method: "POST", // *GET, POST, PUT, DELETE, etc.
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        "model": "llama3",
                        "prompt": body.replace(/ollama /ig, ""),
                        "context": [128006, 882, 128007, 271, 82681, 13, 51223, 3595, 44093, 665, 55467, 13, 31816, 9859, 1826, 23869, 12279, 44, 6620, 13, 44172, 1208, 9904, 46932, 5048, 665, 46932, 519, 3625, 908, 729, 409, 85722, 9517, 66, 16921, 37622, 934, 8839, 1081, 27462, 1370, 1208, 27584, 9148, 483, 551, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 44829, 75871, 3869, 11083, 4860, 665, 513, 3122, 519, 1765, 20662, 9904, 13, 4275, 51625, 1082, 6502, 1744, 9964, 41380, 1208, 9904, 7010, 51309, 9517, 23475, 13, 12095, 9964, 66517, 91558, 16271, 3869, 1208, 9904, 7010, 9637, 90509, 11, 21559, 653, 55520, 5553, 1208, 2199, 1744, 9964, 439, 42587, 978, 3869, 1208, 1913, 409, 9637, 90509, 13, 128009, 128006, 78191, 128007, 271, 82681, 758, 14465, 36731, 23869, 12279, 44, 6620, 13, 14465, 91507, 75289, 466, 1208, 9904, 1880, 9189, 75871, 265, 665, 55467, 13, 3489, 6853, 1826, 15265, 55133, 3488, 949, 128009],
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
                if (reason.message === 'timeout') sendMessage(client, roomId, `J'ai bien peur que mes créateurs ne m'aient alloué trop peu de ressources pour vous répondre dans un temps raisonnable 🤯.`)
                else sendMessage(client, roomId, `Je crois avoir un problème d'accès à mes neurones 😶‍🌫️.`)

            }).finally(() => {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1'
        });

        return true
    }
    return false
}
