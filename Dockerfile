FROM node:20.18.1

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["sh", "-c", "npm run migrate:up && node dist/application.js"]

EXPOSE 31074
