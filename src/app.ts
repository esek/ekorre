import { ApolloServer } from 'apollo-server-express';
import cookieparser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import 'dotenv/config';
import express from 'express';
import { DateResolver } from 'graphql-scalars';
import { GraphQLFileLoader } from '../node_modules/@graphql-tools/graphql-file-loader';
import { loadSchemaSync } from '../node_modules/@graphql-tools/load';
import { makeExecutableSchema } from '../node_modules/@graphql-tools/schema';
// import { GraphQLFileLoader, loadSchemaSync, mergeSchemas } from 'graphql-tools';
import { COOKIES, verifyToken } from './auth';
import config from './config';
import { createDataLoader } from './dataloaders';
import { batchFilesFunction } from './dataloaders/file.dataloader';
import { batchPostsFunction } from './dataloaders/post.dataloader';
import { batchUsersFunction } from './dataloaders/user.dataloader';
import { Logger } from './logger';
import { authDirectiveTransformer } from './middlewares/graphql/auth.directive';
import { errorHandler } from './middlewares/graphql/errorhandler.middleware';
import { permissionsDirectiveTransformer } from './middlewares/graphql/permissions.directive';
import { TokenValue } from './models/auth';
import type { Context, ContextParams } from './models/context';
import * as Resolvers from './resolvers/index';
import authRoute from './routes/auth.routes';
import doorsRoute from './routes/door.routes';
import filesRoute from './routes/files.routes';

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
export let schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

/**
 * Apply schema transformation for directives
 */
schema = authDirectiveTransformer(schema);
schema = permissionsDirectiveTransformer(schema);


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
  app.use(FILES.ENDPOINT, filesRoute);

  // Doors endpoint used by LU to give access
  app.use('/doors', doorsRoute);

  app.use('/auth', authRoute);

  const apolloLogger = Logger.getLogger('Apollo');

  const server = new ApolloServer({
    schema,
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
          const {username} = verifyToken<TokenValue>(accessToken, 'accessToken');
          return username;
        }
        catch {
          return '';
        }
        },
        userDataLoader: createDataLoader(batchUsersFunction),
        postDataLoader: createDataLoader(batchPostsFunction),
        fileDataLoader: createDataLoader(batchFilesFunction),
      };
    },
    debug: ['info', 'debug'].includes(process.env.LOGLEVEL ?? 'normal'),
    plugins: [
      {
        requestDidStart: async ({ request }) => {
          apolloLogger.info(request);
        },
      },
    ],
    formatError: errorHandler,
  });

  await server.start();

  server.applyMiddleware({ app, path: '/', cors: corsOptions });

  app.listen(PORT, HOST, () => {
    logger.log(`Server started on http://${HOST}:${PORT}`);
  });

})();