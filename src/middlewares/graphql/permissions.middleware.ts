import { ForbiddenError } from 'apollo-server-express';
import { GraphQLResolveInfo } from 'graphql';
import { rule } from 'graphql-shield';

import { AccessAPI } from '../../api/access.api';
import { BadRequestError, UnauthenticatedError } from '../../errors/RequestErrors';
import { Logger } from '../../logger';
import { Context } from '../../models/context';
import { accessReducer } from '../../reducers/access.reducer';

const logger = Logger.getLogger('GqlPermissionsMiddleware');

const SUPER_ADMIN = 'super-admin';

const accessAPI = new AccessAPI();

export const withPermissions = (requiredRoles: string[]) =>
  rule()(async (_, __, ctx: Context, info: GraphQLResolveInfo) => {
    try {
      const username = ctx.getUsername();

      // If no username, don't even bother with the rest
      if (username == null || username === '') {
        logger.warn(`Access to ${info.fieldName} was made unsucessfully`);
        return new UnauthenticatedError('Inloggning krävs för denna resursen');
      }

      // Get all the users access
      const access = await accessAPI.getUserFullAccess(username);

      // Remove duplicates and only fetch "web"
      const { web } = accessReducer(access);

      // Convert it to only slugs
      const slugs = web.map((w) => w.slug);

      // See if user is either SUPER_ADMIN or has the required roles
      if (slugs.includes(SUPER_ADMIN) || requiredRoles.some((role) => slugs.includes(role))) {
        return true;
      }

      return new ForbiddenError('Du har inte tillgång till denna resursen');
    } catch (err) {
      logger.error(err);
      return new BadRequestError('Något gick fel på våran sida');
    }
  });
