FROM node:18-bullseye as bot
WORKDIR /app
COPY package*.json ./
RUN npm i --force
COPY . .
ARG RAILWAY_STATIC_URL
ARG PUBLIC_URL
ARG PORT
CMD ["npm", "start"]
