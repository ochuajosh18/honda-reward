FROM node:10

WORKDIR /app

COPY package*.json ./

RUN npm uninstall cookier-parser

RUN npm install cookie-parser -s

RUN npm install

COPY . .

EXPOSE 7009

CMD ["node", "honda.js"]