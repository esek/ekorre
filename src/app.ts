import { ApolloServer } from 'apollo-server-express';
import cookieparser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { DateResolver } from 'graphql-scalars';
import { GraphQLFileLoader, loadSchemaSync, mergeSchemas } from 'graphql-tools';

import { verifyToken } from './auth';
import config from './config';
import { createDataLoader } from './dataloaders';
import { batchUsersFunction } from './dataloaders/user.dataloader';
import type { User } from './graphql.generated';
import { Logger } from './logger';
import type { Context } from './models/context';
import * as Resolvers from './resolvers/index';
import filesRoute from './routes/files.routes';

const { PORT, HOST, FILES } = config;

// Visa en referens till källfilen istället för den kompilerade

Logger.logLevel = Logger.getLogLevelFromString(process.env.LOGLEVEL ?? 'normal');
const logger = Logger.getLogger('App');

/**
 * Alla moduler att ladda
 * En modul måste ha en schema och resolver.
 * De två filer som behövs är
 *  - src/schemas/<modul>.graphql
 *  - src/resolvers/<modul>.resolver.ts
 * och resolvers ska inkluderas i filen src/resolvers/index.ts
 */
const modules = JSON.parse(process.env.MODULES ?? '[]') as string[];

logger.log('Beginning startup...');
logger.log(`I will load the following modules:\n\t\
${modules.join('\n\t')}`);

// Ladda alla scheman från .graphql filer
const schemas = modules.map((module) =>
  loadSchemaSync(`./src/schemas/${module}.graphql`, {
    loaders: [new GraphQLFileLoader()],
    resolvers: {
      Date: DateResolver,
    },
  }),
);

// Gör en map av alla resolvers
const resolvers = Object.entries(Resolvers)
  .filter(([key]) => modules.includes(key))
  .map(([_, value]) => value);

// Konstruera root schema. VIKTIGT! Det senaste schemat kommer skugga andra.
export const schema = mergeSchemas({
  schemas,
  resolvers,
});

// Kör detta async för att kunna använda await.
// eslint-disable-next-line no-void
void (async () => {
  // Starta server.
  const app = express();

  app.use(cookieparser());

  app.use(cors());

  // Setup files endpoint for REST-file handling
  app.use(FILES.ENDPOINT, filesRoute);

  const apolloLogger = Logger.getLogger('Apollo');

  const server = new ApolloServer({
    schema,
    context: ({ req }): Context => {
      const token = req.headers.authorization?.split(' ')[1] ?? '';

      return {
        token,
        getUser: () => verifyToken<User>(token),
        userDataLoader: createDataLoader(batchUsersFunction),
      };
    },
    debug: ['info', 'debug'].includes(process.env.LOGLEVEL ?? 'normal'),
    plugins: [
      {
        requestDidStart({ request }) {
          apolloLogger.info(request);
        },
      },
    ],
    tracing: true,
  });

  await server.start();

  server.applyMiddleware({ app, path: '/', cors: true });

  app.listen(PORT, HOST, () => {
    logger.log(`Server started on ${HOST}:${PORT}`);
  });
})();
