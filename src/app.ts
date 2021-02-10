import { ApolloServer } from 'apollo-server';
import 'dotenv/config';
import { DateResolver } from 'graphql-scalars';
import { GraphQLFileLoader, loadSchemaSync, mergeSchemas } from 'graphql-tools';
import 'source-map-support/register';

import auth from './auth';
import type { Context } from './context';
import type { User } from './graphql.generated';
import { Logger } from './logger';
import * as Resolvers from './resolvers/index';

// Used by userLoader
// userLoader är ett sätt att cacha User, då dessa
// används på flera olika ställen i API:n. Jag har utgått
// från detta projekt: https://github.com/benawad/graphql-n-plus-one-example
import DataLoader = require('../node_modules/dataloader');
import { UserAPI } from './api/user.api';
import { userReducer } from './reducers/user.reducer'

// Visa en referens till källfilen istället för den kompilerade

Logger.logLevel = Logger.getLogLevelFromString(process.env.LOGLEVEL ?? 'normal');
const logger = Logger.getLogger('App');
const userApi = new UserAPI();

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
const schema = mergeSchemas({
  schemas,
  resolvers,
});

// Kör detta async för att kunna använda await.
// eslint-disable-next-line no-void
void (async () => {
  // Starta server.
  const apolloLogger = Logger.getLogger('Apollo');
  const server = new ApolloServer({
    schema,
    context: ({ req }): Context => {
      const token = req.headers.authorization?.split(' ')[1] ?? '';

      return {
        token,
        getUser: () => auth.verifyToken(token) as User,
        userLoader: new DataLoader<string, User>(async (keys) => {
            // TODO: Behöver detta auth? Tror detta ska va gömt bakom auth iaf...
            const users = await userReducer((await userApi.getMultipleUsers(keys))!);

            // Mappar skit, detta är copypasta
            const userMap: any = {};
            users.forEach(user => {
              userMap[user.username] = user;
            });

            // Eeeh
            return keys.map(key => users[key]);
          }),
      }
    },
    debug: ['info', 'debug'].includes(process.env.LOGLEVEL ?? 'normal'),
    plugins: [
      {
        requestDidStart({ request }) {
          apolloLogger.info(request);
        },
      },
    ],
    cors: true,
    tracing: true,
  });

  const serverInfo = await server.listen({
    port: process.env.port ?? 3000,
    host: '0.0.0.0',
  });
  logger.log(`Server started at ${serverInfo.url}`);
})();
