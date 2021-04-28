import { ApolloServer } from 'apollo-server';
import 'dotenv/config';
import { DateResolver } from 'graphql-scalars';
import { GraphQLFileLoader, loadSchemaSync, mergeSchemas } from 'graphql-tools';
import 'source-map-support/register';

import { verifyToken } from './auth';
import { createDataLoader } from './dataloaders';
import { batchUsersFunction } from './dataloaders/user.dataloader';
import type { User } from './graphql.generated';
import { Logger } from './logger';
import type { Context } from './models/context';
import * as Resolvers from './resolvers/index';

// Visa en referens till källfilen istället för den kompilerade

Logger.logLevel = Logger.getLogLevelFromString(process.env.LOGLEVEL ?? 'normal');
const logger = Logger.getLogger('App');

logger.log('Beginning startup...');

// Ladda alla scheman från .graphql filer
const schemas = loadSchemaSync('./src/schemas/*.graphql', {
  loaders: [new GraphQLFileLoader()],
  resolvers: {
    Date: DateResolver,
  },
});

// Gör en map av alla resolvers
const resolvers = Object.entries(Resolvers).map(([_, value]) => value);

// Konstruera root schema. VIKTIGT! Det senaste schemat kommer skugga andra.
export const schema = mergeSchemas({
  schemas: [schemas],
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
    cors: true,
    tracing: true,
  });

  const serverInfo = await server.listen({
    port: process.env.PORT ?? 5000,
    host: '0.0.0.0',
  });
  logger.log(`Server started at ${serverInfo.url}`);
})();
