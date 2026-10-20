import config from '@/config';
import RequestError from '@/errors/request.errors';
import { Logger } from '@/logger';
import { GraphQLError } from 'graphql';

const logger = Logger.getLogger('GraphQLErrorHandler');

export const errorHandler = (err: GraphQLError) => {
  const { originalError } = err;

  if (originalError instanceof RequestError) {
    logger.error(originalError.log());
    // Stacks show server paths and code, so they are only sent in dev
    const { stack, ...response } = originalError.response();
    return config.DEV ? { ...response, stack } : response;
  }

  logger.warn(`Non {RequestError} type found - ${originalError?.name ?? err.name}, see to change`);
  logger.warn(err.message);

  return err;
};
