// Ensure the correct import
import TokenProvider, { getBearerToken } from '@/auth';
import config from '@/config';
import { createDataLoader } from '@/dataloaders';
import { BadRequestError, UnauthenticatedError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import type { Context, ContextParams } from '@/models/context';
import * as Resolvers from '@/resolvers';
import { AccessAPI } from '@api/access';
import { ApiKeyAPI } from '@api/apikey';
import { ApolloServerOptions } from '@apollo/server';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { batchElectionsFunction } from '@dataloader/election';
import { batchFilesFunction } from '@dataloader/file';
import { batchPostsFunction } from '@dataloader/post';
import { batchUsersFunction } from '@dataloader/user';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { loadSchemaSync } from '@graphql-tools/load';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { errorHandler } from '@middleware/graphql/errorhandler';
import { accessReducer } from '@reducer/access';
import { DateResolver, DateTimeResolver } from 'graphql-scalars';

// Load all schemas from .graphql files
const typeDefs = loadSchemaSync('./src/schemas/*.graphql', {
  loaders: [new GraphQLFileLoader()],
});

// Map all resolvers
const resolvers = Object.entries(Resolvers).map(([_, value]) => value);

// Construct root schema
const schema = makeExecutableSchema({
  typeDefs: [typeDefs, 'scalar Date', 'scalar DateTime'],
  resolvers: [{ Date: DateResolver, DateTime: DateTimeResolver }, ...resolvers],
});

const apolloLogger = Logger.getLogger('Apollo');

const accessApi = new AccessAPI();
const apiKeyApi = new ApiKeyAPI();

export const apolloServerContext = async ({ req, res }: ContextParams) => {
  const getXHeader = () => {
    const header = config.X_API_KEY_HEADER;
    const value = req?.headers?.[header] ?? req?.headers?.[header.toLowerCase()];
    return value?.toString().toLowerCase() ?? '';
  };

  const bearerToken = getBearerToken(req);
  const apiKey = getXHeader();

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
};

export const apolloServerConfig: ApolloServerOptions<Context> = {
  schema,
  introspection: process.env.NODE_ENV !== 'production',
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({
      embed: true,
    }),
    {
      requestDidStart: async ({ request }) => {
        apolloLogger.info(request);
      },
    },
  ],
  formatError: errorHandler,
};
