# syntax=docker/dockerfile:1.4
FROM node:16-alpine as build

ENV HOME "/home/app"
WORKDIR ${HOME}

RUN apk add --no-cache \
  bash \
  ca-certificates \
  chromium \
  freetype \
  freetype-dev \
  g++ \
  git \
  harfbuzz \
  make \
  nss \
  openssh \
  python3 \
  ttf-freefont

COPY --link config/ ./config/
COPY --link dist/apps/invoicing-erp-invoice-registration ./
COPY --link node_modules_production ./node_modules

# FROM node:14.7-alpine as dist
# # Copying the rest of the code to the working directory
# COPY --from=build /home/app /
# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run index.js when the container launches
CMD ["node", "--enable-source-maps", "main.js"]

