FROM node:20

ENV YARN_VERSION 4.0.2

RUN yarn policies set-version $YARN_VERSION

WORKDIR /tchap-bot-workdir

COPY /frontend /tchap-bot-workdir/frontend/
COPY /backend /tchap-bot-workdir/backend/

WORKDIR /tchap-bot-workdir/frontend
#RUN cd /tchap-bot-workdir/frontend
RUN yarn install
RUN yarn vite build
RUN rm -Rf /tchap-bot-workdir/backend/static/*
RUN cp -R /tchap-bot-workdir/frontend/dist/* /tchap-bot-workdir/backend/static/
RUN rm -Rf /tchap-bot-workdir/frontend/*
WORKDIR /tchap-bot-workdir/backend
#RUN cd /tchap-bot-workdir/backend
RUN yarn install

ENTRYPOINT ["node",  "/tchap-bot-workdir/backend/server.js"]