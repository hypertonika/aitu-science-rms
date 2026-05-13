# Dockerfile
FROM node:18.20.8-alpine

# create destination directory
WORKDIR /usr/src/app

# update and install dependency
RUN apk update && apk upgrade
RUN apk add git

# copy the app, note .dockerignore
COPY . /usr/src/app/
RUN npm install -g npm
RUN npm install
RUN npm run build

EXPOSE 5173
