import fetchWithError from "../../../utils/fetchWithError.js";
import {MatrixClient} from "matrix-js-sdk";
import {sendMessage} from "../../common/helper.js";
import logger from "../../../utils/logger.js";

/**
 * Initialisation du contexte de réponse. Récupérer body.context :
 * curl -k https://Ollama.gmcd-runner01.eco4.cloud.e2.rie.gouv.fr/api/generate -d '{ "model": "llama3", "prompt": "Bonjour. Répond toujours en français. Ton nom est Bot-GMCD. Lis la documentation suivante en suivant les liens de manière récursive tant qu''ils commencent par la même racine : https://fabrique-numerique.gitbook.io/bnum puis répond à mes questions en utilisant cette documentation. Ne parle du bureau numérique que si la question a trait à la messagerie et qu''une réponse existe dans la documentation. Ne précise pas que tu lis la documentation dans tes réponses. Si tu fais référence à la documentation dans ta réponse, donne le lien de la page que tu as utilisé en référence. N''invente aucun lien !", "stream": false }'
 */


export function ollama(client: MatrixClient, roomId: string, sender: any, body: string) {

    const regex: RegExp = /.*(ollama( |$)).*/i

    if (regex.test(body)) {

        client.sendTyping(roomId, true, 45 * 1000)

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
                        "context": [128006, 882, 128007, 271, 82681, 13, 24703, 7930, 7937, 1826, 514, 2317, 68, 1028, 29557, 61512, 409, 75871, 265, 10253, 37923, 4860, 551, 51223, 3595, 44093, 665, 55467, 13, 31816, 9859, 1826, 23869, 12279, 44, 6620, 13, 44172, 1208, 9904, 46932, 5048, 320, 2485, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 8, 665, 46932, 519, 3625, 908, 729, 951, 6959, 11, 9517, 66, 1759, 91640, 11, 37622, 934, 8839, 687, 72, 89810, 1208, 9148, 483, 551, 9765, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 13, 51223, 3595, 3869, 11083, 4860, 665, 42587, 519, 20662, 9904, 13, 4275, 1370, 273, 3930, 44402, 1661, 78129, 1744, 4502, 1208, 3488, 264, 18027, 3869, 1208, 9622, 1435, 648, 1880, 934, 2957, 90509, 29253, 7010, 1208, 9904, 13, 4275, 51625, 1082, 6502, 1744, 9964, 41380, 1208, 9904, 7010, 51309, 9517, 23475, 13, 128009, 128006, 78191, 128007, 271, 82681, 758, 14465, 36731, 23869, 12279, 44, 6620, 11, 4864, 36731, 550, 49530, 3869, 9189, 91878, 13, 650, 89025, 1153, 261, 26317, 4860, 1880, 4864, 75871, 68962, 665, 34501, 409, 1208, 9904, 3930, 22555, 16610, 78129, 320, 33, 4755, 8, 55852, 3869, 326, 6, 61375, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 13, 128009],
                        "stream": false,
                        "keep_alive": "60m"
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
