# Frontend - Webhooks Tchap

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Frontend pour la gestion des webhooks du bot Tchap GMCD.

## Prérequis

- Node.js
- Yarn

## Installation

Clonez le dépôt et installez les dépendances :

```bash
cd frontend
yarn install
```

## Configuration

Créez un fichier `.env` à la racine du projet et ajoutez les variables d'environnement nécessaires :

```env
VITE_API_ENDPOINT=<votre-api-endpoint>
```

Pour le développement, vous pouvez utiliser le fichier `.env.development` :

```env
VITE_API_ENDPOINT=http://localhost:8085
```

## Démarrage

Pour démarrer le serveur de développement, utilisez la commande suivante :

```bash
yarn start-dev
```

## Scripts

- `yarn build` : Compile le projet pour la production.
- `yarn start-dev` : Démarre le serveur de développement.

## Dépendances

- Vue 3
- Vue Router
- Pinia
- @gouvfr/dsfr
- @gouvminint/vue-dsfr

## Contribuer

Les contributions sont les bienvenues ! Veuillez soumettre une pull request ou ouvrir une issue pour discuter des changements que vous souhaitez apporter.

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](../LICENSE.md) pour plus de détails.
