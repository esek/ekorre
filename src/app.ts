import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { loadSchemaSync } from '@graphql-tools/load';
import { makeExecutableSchema } from '@graphql-tools/schema';
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
} from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import cookieparser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import 'dotenv/config';
import express from 'express';
import { applyMiddleware } from 'graphql-middleware';
import { DateResolver } from 'graphql-scalars';

// import { GraphQLFileLoader, loadSchemaSync, mergeSchemas } from 'graphql-tools';
import { COOKIES, verifyToken } from './auth';
import config from './config';
import { createDataLoader } from './dataloaders';
import { batchAccessResources } from './dataloaders/accessresources.dataloader';
import { batchFilesFunction } from './dataloaders/file.dataloader';
import { batchPostsFunction } from './dataloaders/post.dataloader';
import { batchUsersFunction } from './dataloaders/user.dataloader';
import { Logger } from './logger';
import { authMiddleware } from './middlewares/graphql/auth.middleware';
import { errorHandler } from './middlewares/graphql/errorhandler.middleware';
import { TokenValue } from './models/auth';
import type { Context, ContextParams } from './models/context';
import * as Resolvers from './resolvers/index';
import authRoute from './routes/auth.routes';
import doorsRoute from './routes/door.routes';
import fileRoute from './routes/file.routes';

const { PORT, HOST, FILES, CORS } = config;

// Visa en referens till källfilen istället för den kompilerade

Logger.logLevel = Logger.getLogLevelFromString(process.env.LOGLEVEL ?? 'normal');
const logger = Logger.getLogger('App');

logger.log('Beginning startup...');

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

  const apolloLogger = Logger.getLogger('Apollo');

  const server = new ApolloServer({
    schema: applyMiddleware(schema, authMiddleware),
    context: ({ req, res }: ContextParams): Context => {
      const accessToken = req.cookies[COOKIES.accessToken] ?? '';
      const refreshToken = req.cookies[COOKIES.refreshToken] ?? '';

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
        accessResourceDataloader: createDataLoader(batchAccessResources),
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
  });

  await server.start();

  server.applyMiddleware({ app, path: '/', cors: corsOptions });

  app.listen(PORT, HOST, () => {
    logger.log(`Server started on http://${HOST}:${PORT}`);
  });
})();
