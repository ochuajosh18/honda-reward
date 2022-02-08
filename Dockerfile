FROM node:8.9.0

WORKDIR /app

COPY package*.json ./

COPY . .

RUN npm uninstall cookie-parser

RUN npm install cookie-parser -s

RUN npm install

EXPOSE 7009

CMD ["node", "honda.js"]