# Dockerfile for Node.js + TypeScript backend
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Build TypeScript code and generate Prisma client
RUN npm run build
RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "run", "start"]
