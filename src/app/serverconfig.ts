import TokenProvider from '@/auth';
import { createDataLoader } from '@/dataloaders';
import { BadRequestError, UnauthenticatedError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import type { Context, ContextParams } from '@/models/context';
import * as Resolvers from '@/resolvers';
import { AccessAPI } from '@api/access';
import { ApiKeyAPI } from '@api/apikey';
import { batchElectionsFunction } from '@dataloader/election';
import { batchFilesFunction } from '@dataloader/file';
import { batchPostsFunction } from '@dataloader/post';
import { batchUsersFunction } from '@dataloader/user';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { loadSchemaSync } from '@graphql-tools/load';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { errorHandler } from '@middleware/graphql/errorhandler';
import { accessReducer } from '@reducer/access';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
  Config,
} from 'apollo-server-core';
import { ExpressContext } from 'apollo-server-express';
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

const accessApi = new AccessAPI();
const apiKeyApi = new ApiKeyAPI();

const X_HEADER = 'X-E-Api-Key';

const apolloServerConfig: Config<ExpressContext> = {
  schema,
  context: ({ req, res }: ContextParams): Context => {
    const getXHeader = () => {
      const value = req.headers[X_HEADER] ?? req.headers[X_HEADER.toLocaleLowerCase()];
      return value?.toString().toLowerCase() ?? '';
    };

    const bearerToken = (req?.headers?.authorization ?? '').replace('Bearer ', '');
    const apiKey = getXHeader();

    console.log({ apiKey, bearerToken });

    /**
     * Tries to verify the users access token
     * @returns the verified username
     * @throws UnauthenticatedError if the access token is invalid
     */
    const getUsername = () => {
      if (!bearerToken) {
        if (apiKey) {
          throw new BadRequestError('Detta går inte att göra med en API-nyckel');
        }

        throw new UnauthenticatedError('Du behöver logga in för att göra detta!');
      }

      try {
        const { username } = TokenProvider.verifyToken(bearerToken, 'access_token');
        return username;
      } catch {
        throw new UnauthenticatedError('Denna token är inte längre giltig!');
      }
    };

    /**
     * Gets the user entire access
     * @returns A list of the users access
     */
    const getAccess = async () => {
      if (apiKey) {
        const validKey = await apiKeyApi.checkApiKey(apiKey);

        if (!validKey) {
          throw new UnauthenticatedError('Denna API nyckel är inte giltig!');
        }

        const access = await accessApi.getApiKeyAccess(apiKey);

        return accessReducer(access);
      }

      const username = getUsername();
      const access = await accessApi.getUserFullAccess(username);

      return accessReducer(access);
    };

    return {
      bearerToken,
      apiKey,
      getUsername,
      getAccess,
      response: res,
      request: req,
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
