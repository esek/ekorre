ARG NODE_VERSION=16-alpine
ARG PROJECT=efterphest
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

RUN npm ci --production

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
RUN chmod +x initsql.sh
RUN ./initsql.sh

EXPOSE 5000
CMD ["node", "build/app.js"]
