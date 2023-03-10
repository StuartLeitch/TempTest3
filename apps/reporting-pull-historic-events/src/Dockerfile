# syntax=docker/dockerfile:1.4
FROM node:16-alpine as build

RUN apk add --no-cache \
  git \
  g++ \
  make \
  python3 \
  curl

ENV PHANTOMJS_VERSION 2.1.1
RUN curl -Ls "https://github.com/dustinblackman/phantomized/releases/download/${PHANTOMJS_VERSION}/dockerized-phantomjs.tar.gz" | tar xz -C / \
  && curl -k -Ls https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-${PHANTOMJS_VERSION}-linux-x86_64.tar.bz2 | tar -jxvf - -C / \
  && cp phantomjs-${PHANTOMJS_VERSION}-linux-x86_64/bin/phantomjs /usr/local/bin/phantomjs

ENV HOME "/home/app"

WORKDIR ${HOME}
COPY --link package.json yarn.lock ./
COPY --link node_modules_production ./node_modules

FROM node:16-alpine

# Copying the rest of the code to the working directory
COPY --link config/ ./config/
COPY --link dist/apps/reporting-pull-historic-events .
COPY --link --from=build /home/app/node_modules ./node_modules

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run index.js when the container launches
CMD ["node", "--enable-source-maps", "main.js"]

