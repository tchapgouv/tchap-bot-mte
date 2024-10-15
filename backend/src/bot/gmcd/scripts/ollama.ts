import fetchWithError from "../../../utils/fetchWithError.js";
import {MatrixClient} from "matrix-js-sdk";
import {sendMessage} from "../../common/helper.js";
import logger from "../../../utils/logger.js";

/**
 Initialisation du contexte de réponse. Récupérer $CONTEXT :
 FORMULATION="Bonjour. Ce qui suit est le contexte te permettant de répondre aux futures questions : Ton nom est Bot-GMCD. Répond toujours en français. Lis les documentations suivantes : https://fabrique-numerique.gitbook.io/bnum/premier-pas/glossaire, https://fabrique-numerique.gitbook.io/bnum/tutoriels/apprendre-a/activer-lauthentification-a-deux-facteurs, https://fabrique-numerique.gitbook.io/bnum/tutoriels/apprendre-a/creer-une-signature-pour-mes-courriels, https://fabrique-numerique.gitbook.io/bnum/tutoriels/apprendre-a/mettre-un-message-dabsence, https://fabrique-numerique.gitbook.io/bnum/tutoriels/apprendre-a/migrer-un-salon-ariane-dans-tchap, https://fabrique-numerique.gitbook.io/bnum/ressources/faq, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/messagerie-mel, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/agenda, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/discussions, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/tchap, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/espaces-de-travail, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/espace-de-reunion, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/documents, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/taches, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/annuaire, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/minformer, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/liens-utiles, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/sondage, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/kanban, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/suite-numerique, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/preferences, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/preferences/interface-utilisateur, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/preferences/vue-de-la-boite-de-courriel, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/preferences/affichage-des-courriels, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/preferences/redaction-de-courriels, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/preferences/annuaire, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/preferences/parametres-du-serveur, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/preferences/chiffrement, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/preferences/visioconferences, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/preferences/parametres-visuels, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/preferences/navigation-principale https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/preferences/notifications, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/preferences/agenda, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/dossiers, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/identites-et-signatures, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/generer-ma-signature, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/reponses, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/documents, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/filtres, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/discussions, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/discussions/parametres-generaux, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/discussions/parametres-bnum, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/feuille-de-route, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/informations, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/informations/interface, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/informations/gestion-des-flux, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/authentification-a-deux-facteurs, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/mon-compte, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/mon-compte/informations-personnelles, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/mon-compte/mot-de-passe, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/mon-compte/gestionnaire-dabsence, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/mon-compte/acces-internet, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/mon-compte/synchronisation-mobile, https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/configuration/mon-compte/liens-suspects. Répond à mes questions en utilisant cette documentation. Pour les questions traitées dans la documentation, donne un lien vers la documentation. Ne donne une réponse que si une réponse existe dans la documentation. Ne précise pas que tu lis la documentation dans tes réponses." && \
 CONTEXT=$(curl -k http://localhost:11434/api/generate -d '{ "model": "llama3", "prompt": "'"$FORMULATION"'", "stream": false }' | jq .context) && curl -k http://localhost:11434/api/generate -d '{ "model": "llama3", "prompt": "Bonjour.", "context":'$CONTEXT', "stream": false }' | jq .response && curl -k http://localhost:11434/api/generate -d '{ "model": "llama3", "prompt": "Bonjour. Comment mettre en place ma double authentification ?", "context":'$CONTEXT', "stream": false }' | jq .response
 ----------
 CONTEXT=[128006,882,128007,271,82681,13,24703,...,...,5512,55745,6502,3869,757,7631,261,4502,9189,47592,6316,3488,758,128009]
 */

export const CONTEXT = [128006, 882, 128007, 271, 82681, 13, 24703, 7930, 7937, 1826, 514, 2317, 68, 1028, 29557, 61512, 409, 75871, 265, 10253, 37923, 4860, 551, 31816, 9859, 1826, 23869, 12279, 44, 6620, 13, 51223, 3595, 44093, 665, 55467, 13, 44172, 3625, 2246, 811, 46932, 15844, 551, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 37359, 76, 1291, 2320, 300, 4951, 9563, 12267, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 5640, 4936, 72, 2053, 10867, 9484, 265, 7561, 14, 533, 1553, 2922, 3322, 306, 2461, 7561, 6953, 2249, 2269, 533, 38647, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 5640, 4936, 72, 2053, 10867, 9484, 265, 7561, 14, 846, 261, 12, 2957, 29053, 1598, 2320, 414, 1474, 288, 1824, 414, 462, 2053, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 5640, 4936, 72, 2053, 10867, 9484, 265, 7561, 3262, 7211, 265, 20486, 30432, 1773, 3518, 768, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 5640, 4936, 72, 2053, 10867, 9484, 265, 7561, 3262, 5346, 261, 20486, 1355, 44711, 12, 8997, 68, 1773, 598, 2442, 93419, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 14, 46623, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 3262, 434, 1435, 648, 1474, 301, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 65131, 9895, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 96554, 39833, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 5640, 93419, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 14, 25632, 2492, 6953, 10398, 71363, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 39528, 1330, 6953, 5621, 16588, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 98190, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 5640, 14576, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 14, 1036, 4381, 556, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 45273, 35627, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 89481, 729, 12, 332, 3742, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 14, 942, 67, 425, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 14, 8826, 6993, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 2754, 9486, 32294, 261, 2428, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 76584, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 76584, 48222, 74546, 33226, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 76584, 72697, 6953, 53926, 70566, 635, 6953, 1824, 414, 22811, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 76584, 14, 2715, 73265, 25520, 1824, 414, 462, 2053, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 76584, 79000, 1335, 6953, 1824, 414, 462, 2053, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 76584, 14, 1036, 4381, 556, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 76584, 14, 913, 295, 417, 98305, 12, 13570, 324, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 76584, 21987, 3168, 55755, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 76584, 14, 2749, 822, 444, 5006, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 76584, 14, 913, 295, 417, 82489, 61244, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 76584, 84365, 27748, 5824, 1604, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 76584, 14, 39288, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 76584, 65131, 9895, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 3529, 3746, 4918, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 14, 1748, 3695, 97110, 29053, 2859, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 4951, 804, 261, 1474, 64, 29053, 1598, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 10991, 23475, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 98190, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 6801, 3036, 417, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 96554, 39833, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 96554, 39833, 14, 913, 295, 417, 2427, 804, 12249, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 96554, 39833, 14, 913, 295, 417, 1481, 2470, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 14, 1897, 84, 4618, 6953, 82659, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 18480, 630, 811, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 18480, 630, 811, 48222, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 18480, 630, 811, 4951, 43598, 25520, 12556, 2249, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 17823, 306, 2461, 7561, 6953, 2249, 2269, 533, 38647, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 14, 1677, 11733, 25123, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 14, 1677, 11733, 25123, 18480, 630, 811, 29145, 8301, 645, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 14, 1677, 11733, 25123, 3262, 354, 6953, 2320, 13559, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 14, 1677, 11733, 25123, 4951, 43598, 29583, 1773, 3518, 768, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 14, 1677, 11733, 25123, 70571, 1634, 20653, 14166, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 14, 1677, 11733, 25123, 2754, 14445, 8082, 42179, 11, 3788, 1129, 37955, 34395, 32294, 261, 2428, 33899, 2239, 4340, 3554, 2470, 14, 676, 2415, 4951, 35805, 25520, 2269, 263, 407, 43078, 3695, 90542, 14, 1677, 11733, 25123, 89481, 729, 1355, 355, 8132, 13, 51223, 3595, 3869, 11083, 4860, 665, 42587, 519, 20662, 9904, 13, 27058, 3625, 4860, 18027, 14014, 7010, 1208, 9904, 11, 21559, 653, 55520, 5553, 1208, 9904, 13, 4275, 21559, 6316, 90509, 1744, 4502, 934, 4708, 2957, 90509, 29253, 7010, 1208, 9904, 13, 4275, 51625, 1082, 6502, 1744, 9964, 41380, 1208, 9904, 7010, 51309, 9517, 23475, 13, 128009, 128006, 78191, 128007, 271, 82681, 758, 14465, 36731, 23869, 12279, 44, 6620, 11, 1880, 4864, 36731, 550, 49530, 3869, 75871, 265, 3869, 26317, 4860, 665, 42587, 519, 3625, 9477, 409, 91558, 16271, 1744, 9189, 296, 6, 52659, 3116, 26209, 382, 30854, 5296, 1744, 503, 34155, 6316, 1317, 361, 34024, 409, 908, 729, 5553, 951, 594, 40751, 1880, 951, 26370, 72, 2053, 426, 2470, 13, 12095, 9189, 47592, 6316, 3488, 71269, 52760, 11, 5320, 84, 68490, 1208, 1153, 261, 11, 1880, 4864, 18728, 2192, 409, 1647, 64972, 5019, 9189, 81994, 404, 6316, 90509, 3122, 8047, 1765, 27750, 9477, 382, 45, 39982, 5512, 55745, 6502, 3869, 757, 7631, 261, 4502, 9189, 47592, 6316, 3488, 758, 128009]

export function ollama(client: MatrixClient, roomId: string, sender: any, body: string) {

    // const regex: RegExp = /.*(ollama( |$)).*/i

    // if (regex.test(body)) {

    client.sendTyping(roomId, true, 45 * 1000)

    const prompt = body.toLowerCase().replaceAll("bot-gmcd [developpement-durable]", "").replaceAll("bot-gmcd", "")
    logger.notice("Ollama search : " + prompt)

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
                    "prompt": prompt,
                    "context": CONTEXT,
                    "stream": false,
                    "keep_alive": "24h"
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
            client.sendTyping(roomId, false, 60 * 1000)
            if (reason.message === 'timeout') sendMessage(client, roomId, `J'ai bien peur que mes créateurs ne m'aient alloué trop peu de ressources pour vous répondre dans un temps raisonnable 🤯.`)
            else sendMessage(client, roomId, `Je crois avoir un problème d'accès à mes neurones 😶‍🌫️.`)

        }).finally(() => {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1'
    });

    return true
    // }
    // return false
}
