import 'source-map-support/register'; // Show reference to source file in stack trace instead of compiled
import 'dotenv/config';

import { ApolloServer } from 'apollo-server';
import { GraphQLFileLoader, loadSchemaSync, mergeSchemas } from 'graphql-tools';

import { Logger } from './logger';
import * as Resolvers from './resolvers/index';
import auth from './auth';
import type { Context } from './context';
import type { User } from './graphql.generated';

Logger.logLevel = Logger.getLogLevelFromString(process.env.LOGLEVEL ?? 'normal');
const logger = Logger.getLogger('App');

/**
 * All modules to load.
 * A module must have a schema and resolver.
 * The two files that are required are:
 *  - src/schemas/<module>.graphql
 *  - src/resolvers/<module>.resolver.ts
 * and resolver should be included in file src/resolvers/index.ts
 */
const modules = ['user'];

logger.log('Beginning startup...');
logger.log(`I will load the following modules:\n\t\
${modules.join('\n\t')}`);

// Load all schemas from .graphql files.
const schemas = modules.map((module) =>
  loadSchemaSync(`./src/schemas/${module}.graphql`, {
    loaders: [new GraphQLFileLoader()],
  }),
);

// Map all resolvers into one array.
const resolvers = Object.entries(Resolvers)
  .filter(([key]) => modules.includes(key))
  .map(([_, value]) => value);

// Construct root schema. NOTE!: The latest schema will shadow others and not warn.
const schema = mergeSchemas({
  schemas,
  resolvers,
});

// Run this async to be able to use await for serverInfo.
// eslint-disable-next-line no-void
void (async () => {
  // Start server.
  const apolloLogger = Logger.getLogger('Apollo');
  const server = new ApolloServer({
    schema,
    context: ({ req }): Context => {
      const token = req.headers.authorization?.split(' ')[1] ?? '';

      return {
        token,
        getUser: () => auth.verifyToken(token) as User,
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
  });

  const serverInfo = await server.listen({
    port: process.env.port ?? 3000,
    host: '0.0.0.0',
  });
  logger.log(`Server started at ${serverInfo.url}`);
})();
