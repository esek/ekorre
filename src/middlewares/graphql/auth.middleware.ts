import type { IMiddlewareFunction } from 'graphql-middleware';

import { AccessAPI } from '../../api/access.api';
import RequestError, { ForbiddenError, UnauthenticatedError } from '../../errors/RequestErrors';
import { Logger } from '../../logger';
import { Context } from '../../models/context';
import { accessReducer } from '../../reducers/access.reducer';

const api = new AccessAPI();
const logger = Logger.getLogger('GqlAuthMiddleware');

export const checkAuthMiddleware: IMiddlewareFunction<unknown, Context> = async (
  resolve,
  root,
  args,
  context,
  info,
) => {
  // Get the name of the resolver and if it's a query or mutation
  const resolverType = info.operation.operation;
  const resolverName = info.path.prev?.key.toString();

  if (resolverType && resolverName) {
    try {
      /** Get the mapped accessrequirements
       * @throws if no mapping (and will resolve below)
       */
      const access = await api.getAccessMapping(
        resolverType.toLowerCase(),
        resolverName.toLowerCase(),
      );

      const username = context.getUsername();

      // if user is not logged in
      if (!username) {
        return new UnauthenticatedError('Du måste logga in för att se denna resursen');
      }

      // If only login is required, (refresouce is null / '')
      if (access.some((a) => !a.refresource)) {
        return resolve(root, args, context, info);
      }

      const userAccess = await api.getUserFullAccess(username);
      const { web } = accessReducer(userAccess);

      // Map it so it's only the slugs
      const slugs = web.map((w) => w.slug);

      // If user does not have access, send back 403
      if (!access.some((r) => slugs.includes(r.refresource))) {
        const requiredAccess = access.map((a) => a.refresource).join(',');
        return new ForbiddenError(
          `Du måste ha någon av rollerna: [${requiredAccess}] för att komma åt denna resursen`,
        );
      }
    } catch (err) {
      logger.warn((err as RequestError).message);
    }
  }

  return resolve(root, args, context, info);
};
