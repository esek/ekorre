import RequestError from '@/errors/request.errors';
import { Logger } from '@/logger';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

const logger = Logger.getLogger('GraphQLErrorHandler');

export const errorHandler = (
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError => {
  if (error instanceof GraphQLError && error.originalError instanceof RequestError) {
    const originalError = error.originalError;

    logger.error(originalError.log());

    return {
      ...formattedError,
      extensions: {
        ...formattedError.extensions,
        code: originalError.code,
        statusCode: originalError.code,
        errorType: originalError.name,
        stack: process.env.NODE_ENV === 'development' ? originalError.stack : undefined,
      },
    };
  }

  logger.warn(
    `Unhandled error type: ${error instanceof GraphQLError ? error.message : 'Unknown error'}`,
  );

  return {
    ...formattedError,
    extensions: {
      ...formattedError.extensions,
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
      stack: process.env.NODE_ENV === 'development' ? (error as GraphQLError)?.stack : undefined,
    },
  };
};
