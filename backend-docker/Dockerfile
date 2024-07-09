FROM node:22

ENV YARN_VERSION 4.0.2

RUN yarn policies set-version $YARN_VERSION

WORKDIR /tchap-bot-workdir

COPY /frontend /tchap-bot-workdir/frontend/
COPY /backend /tchap-bot-workdir/backend/

WORKDIR /tchap-bot-workdir

RUN cd /tchap-bot-workdir/frontend && \
    yarn policies set-version $YARN_VERSION && \
    yarn install  && \
    yarn vite build  && \
    mkdir -p /tchap-bot-workdir/backend/src/static/  && \
    cp -R /tchap-bot-workdir/frontend/dist/* /tchap-bot-workdir/backend/src/static/  && \
    cd /tchap-bot-workdir/backend  && \
    yarn install  && \
    yarn build

ENTRYPOINT ["yarn",  "--cwd", "/tchap-bot-workdir/backend/", "start-prod"]