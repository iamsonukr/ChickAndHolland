FROM node:18.16.0-alpine

WORKDIR /usr/src/app

COPY ./package.json /usr/src/app/

RUN npm i --silent

ENV NODE_ENV=production

COPY . .

RUN npm run build

ENV PORT=5000

EXPOSE 5000

RUN chown -R node /usr/src/app

USER node

CMD ["npm", "start"]
