import { useDirective } from '.';

import { UnauthenticatedError } from '../../errors/RequestErrors';

export const authDirectiveTransformer = useDirective('authRequired', (ctx, resolve) => {
  const username = ctx.getUsername();

  /**
   * Try to get the username from the context and if it fails
   * it means that the user is not authenticated.
   */

  if (!username) {
    throw new UnauthenticatedError('Du måste logga in för att se denna resursen');
  }

  return resolve();
});
