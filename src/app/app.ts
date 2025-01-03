import config from '@/config';
import { Context } from '@/models/context';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import fileRoute from '@route/file';
import healthRoute from '@route/health';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors, { type CorsOptions } from 'cors';
import express from 'express';

import { apolloServerConfig, apolloServerContext } from './serverconfig';

const { FILES, DEV } = config;

// Initialize Express app
export const app = express();

// CORS setup for DEV environment
if (DEV) {
  const corsOptions: CorsOptions = {
    credentials: true,
    origin: true,
  };
  app.use(cors(corsOptions));
}

// Middleware setup
app.use(cookieParser());
app.use(bodyParser.json()); // Required for parsing JSON bodies

// REST routes
app.use(FILES.ENDPOINT, fileRoute);
app.use('/health', healthRoute);

// Initialize Apollo Server
const server = new ApolloServer(apolloServerConfig);

(async () => {
  await server.start();

  // Apply Apollo middleware
  app.use('/', expressMiddleware<Context>(server, { context: apolloServerContext }));
})();
