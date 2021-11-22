FROM node:15-alpine
WORKDIR /srv/app

# Kopiera både package.json och pacakge-lock.json
COPY package*.json ./
RUN npm ci --no-optional

COPY tsconfig.json tsconfig.json
COPY tsconfig.build.json tsconfig.build.json

COPY src src
RUN npm run build

# Default env värden för prod
ENV PORT=5000

EXPOSE $PORT

CMD ["node", "build/app.js"]