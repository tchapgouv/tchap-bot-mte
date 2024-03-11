# Dev

``` sh
cd frontend
yarn vite
```
``` sh
cd backend
node server.js
```

# Production

``` sh
cd frontend
yarn vite build
cd ..
rm -Rf ./backend/static/* && cp -R ./frontend/dist/* ./backend/static/
cd backend
node server.js 
``` 