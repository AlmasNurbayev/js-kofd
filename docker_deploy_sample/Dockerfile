# дефолтная версия `Node.js`
ARG NODE_VERSION=18-alpine

# используемый образ
FROM node:$NODE_VERSION

# рабочая директория
WORKDIR /app

COPY package*.json ./
#COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production
RUN npx prisma migrate deploy

COPY . .

# RUN npm run create - скрипт запускается в контейнере postgres

CMD ["npm", "run", "index"]

