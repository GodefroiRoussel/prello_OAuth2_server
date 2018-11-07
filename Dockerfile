FROM node:8

LABEL maintainer="godefroi roussel <godefroi.roussel@gmail.com>"

RUN mkdir /home/app

WORKDIR /home/app

COPY package.json .

RUN npm install

RUN rm -rf ./node_modules/oauth2-server/lib 

RUN mkdir ./node_modules/oauth2-server/lib 

ADD lib ./node_modules/oauth2-server/lib

COPY index.js .

COPY model.js .

RUN mkdir views

COPY views ./views

EXPOSE 3000

CMD ["node", "index.js"]