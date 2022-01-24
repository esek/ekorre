import RequestError from '@/errors/request.errors';
import { Logger } from '@/logger';
import { GraphQLError } from 'graphql';

const logger = Logger.getLogger('GraphQLErrorHandler');

export const errorHandler = (err: GraphQLError) => {
  const { originalError } = err;

  if (originalError instanceof RequestError) {
    logger.error(originalError.log());
    return originalError.response();
  }

  logger.warn(`Non {RequestError} type found - ${originalError?.name ?? err.name}, see to change`);

  return err;
};
