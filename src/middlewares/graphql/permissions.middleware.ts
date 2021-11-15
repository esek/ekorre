import { ForbiddenError } from 'apollo-server-express';
import { rule } from 'graphql-shield';

import { AccessAPI } from '../../api/access.api';
import { BadRequestError, UnauthenticatedError } from '../../errors/RequestErrors';
import { Context } from '../../models/context';
import { accessReducer } from '../../reducers/access.reducer';

const SUPER_ADMIN = 'super-admin';

const accessAPI = new AccessAPI();

export const withPermissions = (requiredRoles: string[]) =>
  rule()(async (_, __, ctx: Context) => {
    try {
      const username = ctx.getUsername();

      // If no username, don't even bother with the rest
      if (username == null || username == '') {
        return new UnauthenticatedError('Inloggning krävs för denna resursen');
      }

      // Get all the users access
      const access = await accessAPI.getUserFullAccess(username);

      // Remove duplicates and only fetch "web"
      const { web } = accessReducer(access);

      // Convert it to only slugs
      const slugs = web.map((w) => w.slug);

      // See if user is either SUPER_ADMIN or has the required roles
      if (slugs.includes(SUPER_ADMIN) || slugs.some((s) => requiredRoles.includes(s))) {
        return true;
      }

      return new ForbiddenError('Du har inte tillgång till denna resursen');
    } catch (err) {
      console.error(err);
      return new BadRequestError('Något gick fel på våran sida');
    }
  });
