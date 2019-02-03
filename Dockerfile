## Pull the mysql:5.7 image
FROM mysql:5.7

## The maintainer name and email
MAINTAINER David Hormaza <dehormazah@unal.edu.co>

# database = courts and password for root = 12345678
ENV MYSQL_DATABASE=courts_db \
    MYSQL_ROOT_PASSWORD=12345678

FROM node:8

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "start"]
