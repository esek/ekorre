// import { GraphQLFileLoader, loadSchemaSync, mergeSchemas } from 'graphql-tools';
import config from '@/config';
import fileRoute from '@route/file';
import healthRoute from '@route/health';
import { ApolloServer } from 'apollo-server-express';
import cookieparser from 'cookie-parser';
import express from 'express';

import apolloServerConfig from './serverconfig';

const { FILES } = config;

// Visa en referens till källfilen istället för den kompilerade

// Starta server.
export const app = express();

(async () => {
  app.use(cookieparser());

  // Setup files endpoint for REST-file handling
  app.use(FILES.ENDPOINT, fileRoute);

  app.use('/health', healthRoute);

  const server = new ApolloServer(apolloServerConfig);

  await server.start();

  server.applyMiddleware({ app, path: '/' });
})();
