FROM node:20-alpine
# Install Node.js and npm

WORKDIR /app

# Install dependencies
COPY package*.json ./


COPY . .

RUN npm install

EXPOSE 3000

CMD npm run dev

