import { ApolloServer } from 'apollo-server-express';
import cookieparser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import 'dotenv/config';
import express from 'express';
import { DateResolver } from 'graphql-scalars';
import { GraphQLFileLoader, loadSchemaSync, mergeSchemas } from 'graphql-tools';

import { COOKIES, verifyToken } from './auth';
import config from './config';
import { createDataLoader } from './dataloaders';
import { batchPostsFunction } from './dataloaders/post.dataloader';
import { batchUsersFunction } from './dataloaders/user.dataloader';
import type { User } from './graphql.generated';
import { Logger } from './logger';
import { errorHandler } from './middlewares/graphql/errorhandler.middleware';
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

    // console.log({ accessToken, refreshToken });

    return {
      accessToken,
      refreshToken,
      response: res,
      request: req,
      getUser: () => verifyToken<User>(accessToken, 'accessToken'),
      userDataLoader: createDataLoader(batchUsersFunction),
      postDataLoader: createDataLoader(batchPostsFunction),
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
  formatError: errorHandler,
});

server.applyMiddleware({ app, path: '/', cors: corsOptions });

app.listen(PORT, HOST, () => {
  logger.log(`Server started on http://${HOST}:${PORT}`);
});
