// import { GraphQLFileLoader, loadSchemaSync, mergeSchemas } from 'graphql-tools';
import config from '@/config';
import fileRoute from '@route/file';
import healthRoute from '@route/health';
import { ApolloServer, ServerRegistration } from 'apollo-server-express';
import cookieparser from 'cookie-parser';
import cors, { type CorsOptions } from 'cors';
import express from 'express';

import apolloServerConfig from './serverconfig';

const { FILES, DEV } = config;

// Visa en referens till källfilen istället för den kompilerade

// Starta server.
export const app = express();

const registration: ServerRegistration = {
  app,
  path: '/',
};

// this is handled by traefik in other envs
if (DEV) {
  const options: CorsOptions = {
    credentials: true,
    origin: true,
  };
  app.use(cors(options));
  registration.cors = options;
}

(async () => {
  app.use(cookieparser());

  // Setup files endpoint for REST-file handling
  app.use(FILES.ENDPOINT, fileRoute);

  app.use('/health', healthRoute);

  const server = new ApolloServer(apolloServerConfig);

  await server.start();

  server.applyMiddleware(registration);
})();
