FROM mcr.microsoft.com/devcontainers/typescript-node:0-18

USER node

RUN sudo apt-get update && \
    sudo apt-get upgrade && \
    sudo apt-get install --no-install-recommends -y build-essential nodejs npm libcurl4-gnutls-dev libicu-dev zlib1g-dev pkg-config cmake subversion

COPY . /app
WORKDIR /app

CMD npm install && npm run generate:kjv && npm run build