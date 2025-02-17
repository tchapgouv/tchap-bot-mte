FROM node:22-slim

WORKDIR /tchap-bot-workdir

COPY /frontend /tchap-bot-workdir/frontend/
COPY /backend /tchap-bot-workdir/backend/

ENV YARN_VERSION 4.1.0
ENV http_proxy http://pfrie-std.proxy.e2.rie.gouv.fr:8080
ENV ALL_PROXY "$http_proxy"

WORKDIR /tchap-bot-workdir/

RUN echo "$http_proxy"

RUN corepack enable
RUN corepack use yarn@"$YARN_VERSION"
RUN yarn config set httpProxy "$http_proxy"
RUN yarn config set httpsProxy "$http_proxy"
WORKDIR /tchap-bot-workdir/frontend
RUN cd /tchap-bot-workdir/frontend
RUN echo "VITE_API_ENDPOINT=" > .env
RUN yarn install
RUN yarn vite build
RUN mkdir -p /tchap-bot-workdir/backend/src/static/
RUN cp -R /tchap-bot-workdir/frontend/dist/* /tchap-bot-workdir/backend/src/static/
WORKDIR /tchap-bot-workdir/backend
RUN cd /tchap-bot-workdir/backend
RUN yarn install
RUN yarn build

ENTRYPOINT ["yarn",  "--cwd", "/tchap-bot-workdir/backend/", "start-prod"]