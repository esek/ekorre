FROM node:15-alpine
WORKDIR /srv/app

# Kopiera både package.json och pacakge-lock.json
COPY package*.json ./
RUN npm ci

COPY tsconfig.json tsconfig.json

COPY src src
RUN npm run build

# Default env värden för prod
ENV PORT=5000
ENV DB_CLIENT=mysql2
ENV DB_HOST=localhost
ENV MODULES='["user", "post", "access", "article"]'

EXPOSE $PORT

CMD ["node", "build/app.js"]