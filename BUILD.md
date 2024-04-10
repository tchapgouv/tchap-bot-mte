# Déploiement des sources

## En mode développement

``` sh
cd frontend
yarn dev
```

``` sh
cd backend
yarn start-dev
```

## En mode production

### Docker

```sh
docker compose up --build --detach && docker logs -f tchap-bot
```

### À partir des sources

``` sh
cd frontend
yarn vite build
cd ..
rm -Rf ./backend/static/* && cp -R ./frontend/dist/* ./backend/static/
cd backend
yarn build 
yarn start-prod
```