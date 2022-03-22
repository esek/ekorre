import { COOKIES, verifyToken } from '@/auth';
import { createDataLoader } from '@/dataloaders';
import { Logger } from '@/logger';
import { TokenValue } from '@/models/auth';
import type { Context, ContextParams } from '@/models/context';
import * as Resolvers from '@/resolvers';
import { batchElectionsFunction } from '@dataloader/election';
import { batchFilesFunction } from '@dataloader/file';
import { batchPostsFunction } from '@dataloader/post';
import { batchUsersFunction } from '@dataloader/user';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { loadSchemaSync } from '@graphql-tools/load';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { authMiddleware } from '@middleware/graphql/auth';
import { errorHandler } from '@middleware/graphql/errorhandler';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
  Config,
} from 'apollo-server-core';
import { ExpressContext } from 'apollo-server-express';
import { applyMiddleware } from 'graphql-middleware';
import { DateResolver } from 'graphql-scalars';

// Ladda alla scheman från .graphql filer
const typeDefs = loadSchemaSync('./src/schemas/*.graphql', {
  loaders: [new GraphQLFileLoader()],
  resolvers: {
    Date: DateResolver,
  },
});

// Gör en map av alla resolvers
const resolvers = Object.entries(Resolvers).map(([_, value]) => value);

// Konstruera root schema. VIKTIGT! Det senaste schemat kommer skugga andra.
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const apolloLogger = Logger.getLogger('Apollo');

const apolloServerConfig: Config<ExpressContext> = {
  schema: applyMiddleware(schema, authMiddleware),
  context: ({ req, res }: ContextParams): Context => {
    const accessToken = req?.cookies[COOKIES.accessToken] ?? '';
    const refreshToken = req?.cookies[COOKIES.refreshToken] ?? '';

    return {
      accessToken,
      refreshToken,
      response: res,
      request: req,
      getUsername: () => {
        try {
          const { username } = verifyToken<TokenValue>(accessToken, 'accessToken');
          return username;
        } catch {
          return '';
        }
      },
      userDataLoader: createDataLoader(batchUsersFunction),
      postDataLoader: createDataLoader(batchPostsFunction),
      fileDataLoader: createDataLoader(batchFilesFunction),
      electionDataLoader: createDataLoader(batchElectionsFunction),
    };
  },
  debug: ['info', 'debug'].includes(process.env.LOGLEVEL ?? 'normal'),
  plugins: [
    {
      requestDidStart: async ({ request }) => {
        apolloLogger.info(request);
        return Promise.resolve();
      },
    },
    // If we are in development, run GraphQL Playground
    // TODO: Upgrade to GraphiQL
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    process.env.NODE_ENV === 'production'
      ? ApolloServerPluginLandingPageDisabled()
      : ApolloServerPluginLandingPageGraphQLPlayground(),
  ],
  formatError: errorHandler,
};

export default apolloServerConfig;
