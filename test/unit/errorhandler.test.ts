import config from '@/config';
import { ServerError } from '@/errors/request.errors';
import { errorHandler } from '@/middlewares/graphql/errorhandler.middleware';
import { GraphQLError } from 'graphql';

const graphqlError = () =>
  new GraphQLError('Ett databasfel inträffade', { originalError: new ServerError('Ett databasfel inträffade') });

describe('errorHandler', () => {
  const dev = config.DEV;
  afterEach(() => {
    config.DEV = dev;
  });

  it('sends the stack in dev', () => {
    config.DEV = true;
    expect(errorHandler(graphqlError())).toHaveProperty('stack');
  });

  it('leaves out the stack in production', () => {
    config.DEV = false;
    const response = errorHandler(graphqlError());
    expect(response).not.toHaveProperty('stack');
    expect(response).toMatchObject({ errorType: 'ServerError', statusCode: 500 });
  });
});
