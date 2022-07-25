ARG NODE_VERSION=16-alpine
ARG PROJECT=ekorre
ARG WORKING_DIR=/srv/app

##
## Build
##
FROM node:${NODE_VERSION} as BUILD_IMAGE

# Make arg available
ARG WORKING_DIR

# Create app directory
WORKDIR $WORKING_DIR

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm ci

# Bundle app source
COPY . .

RUN npm run prisma:generate

RUN npm run build

RUN npm prune --omit=dev

RUN mkdir public

##
## Create runtime image
##
FROM node:${NODE_VERSION}

ARG WORKING_DIR
ARG PROJECT
ENV NODE_ENV=production

WORKDIR $WORKING_DIR

# Best practices
# https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
RUN apk add --no-cache tini bash
ENTRYPOINT [ "/sbin/tini", "--" ]

RUN wget https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh; chmod +x wait-for-it.sh

COPY --from=BUILD_IMAGE $WORKING_DIR/. .

EXPOSE 3000

# Run using tsconfig-paths to rewrite paths
CMD ["node", "-r", "ts-node/register/transpile-only", "-r", "tsconfig-paths/register", "build/src/index.js"]
