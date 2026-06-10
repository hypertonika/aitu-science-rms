# Dockerfile
FROM node:18.20.8-alpine

# create destination directory
WORKDIR /usr/src/app
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL

# update and install dependency
RUN apk update && apk upgrade
RUN apk add git

# copy the app, note .dockerignore
COPY . /usr/src/app/
RUN npm install -g npm
RUN npm install
RUN npm run build

EXPOSE 5173
