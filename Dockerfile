ARG NODE_VERSION=16-alpine
ARG PROJECT=ekorre
ARG WORKING_DIR=/srv/app

##
## Build
##
FROM node:${NODE_VERSION} as BUILD_IMAGE
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

RUN npm run build

RUN npm prune --production

##
## Create runtime image
##
FROM node:${NODE_VERSION}

ARG WORKING_DIR
ARG PROJECT
ENV NODE_ENV=production

WORKDIR $WORKING_DIR

COPY --from=BUILD_IMAGE $WORKING_DIR/. ./.

RUN apk update
RUN apk add sqlite
RUN chmod +x tools/initenv.sh
RUN ./tools/initenv.sh

LABEL project=$PROJECT

EXPOSE 3001

# Run using tsconfig-paths to rewrite paths
CMD ["node", "-r", "ts-node/register/transpile-only", "-r", "tsconfig-paths/register", "build/src/index.js"]
