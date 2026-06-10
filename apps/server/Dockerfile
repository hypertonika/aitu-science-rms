FROM node
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json /app/
RUN npm install
COPY . /app
CMD ["node", "server.js"]
