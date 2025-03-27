# Bot GMCD et gestion des Webhooks

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Projet permettant de démarrer un bot ainsi qu’un frontend de gestion des webhooks.
La gestion du chiffrement se fait via le middleware Pantalaimon.

## Prérequis

- Node.js
- Yarn

## Installation

Se référer aux README des dossiers `frontend` et `backend`.
En particulier, valoriser les fichiers ``.env`` en s'appuyant sur les exemples.

## Lancement

Ajuster les fichiers :
-  [pantalaimon.conf](backend-pantalaimon/conf/pantalaimon.conf)
   - En particulier le `Homeserver` 
-  [Dockerfile](backend-docker/Dockerfile)
   - ``http_proxy``

Puis lancer simplement le [docker-compose.yml](docker-compose.yml)
- ``sudo docker compose up``