import { rule } from 'graphql-shield';

import { UnauthenticatedError } from '../../errors/RequestErrors';
import { Context } from '../../models/context';

export const isAuthenticated = () =>
  rule()((_, __, ctx: Context) => {
    const username = ctx.getUsername();

    // No need to actually fetch the user, if the JWT fails, the user is not authenticated
    if (username == null || username === '') {
      return new UnauthenticatedError('Inloggning krävs för denna resursen');
    }

    return true;
  });
