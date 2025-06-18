FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npx browserslist@latest --update-db

COPY . .

EXPOSE 3000

CMD [ "npm", "run", "dev" ]
