import { ApolloServer } from 'apollo-server-express';
import cookieparser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import 'dotenv/config';
import express from 'express';

// import { GraphQLFileLoader, loadSchemaSync, mergeSchemas } from 'graphql-tools';
import config from './config';
import { Logger } from './logger';
import authRoute from './routes/auth.routes';
import doorsRoute from './routes/door.routes';
import fileRoute from './routes/file.routes';
import apolloServerConfig from './serverconfig';

const { PORT, HOST, FILES, CORS } = config;

// Visa en referens till källfilen istället för den kompilerade

Logger.logLevel = Logger.getLogLevelFromString(process.env.LOGLEVEL ?? 'normal');
const logger = Logger.getLogger('App');

logger.log('Beginning startup...');

(async () => {
  // Starta server.
  const app = express();

  const corsOptions: CorsOptions = {
    origin: CORS.ALLOWED_ORIGINS,
    credentials: true,
  };

  app.use(cookieparser());

  app.use(cors(corsOptions));

  // Setup files endpoint for REST-file handling
  app.use(FILES.ENDPOINT, fileRoute);

  // Doors endpoint used by LU to give access
  app.use('/doors', doorsRoute);

  app.use('/auth', authRoute);

  const server = new ApolloServer(apolloServerConfig);

  await server.start();

  server.applyMiddleware({ app, path: '/', cors: corsOptions });

  app.listen(PORT, HOST, () => {
    logger.log(`Server started on http://${HOST}:${PORT}`);
  });
})();
