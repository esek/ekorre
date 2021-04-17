FROM node:15-alpine
WORKDIR /srv/app

COPY package*.json ./
RUN npm install

COPY tsconfig.json tsconfig.json

COPY src src
RUN npm run build

ENV PORT=5000
ENV DB_CLIENT=mysql2
ENV DB_HOST=localhost
ENV MODULES='["user", "post", "access", "article"]'

EXPOSE $PORT

CMD ["node", "build/app.js"]