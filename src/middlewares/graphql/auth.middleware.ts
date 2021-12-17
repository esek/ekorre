import type { IMiddleware, IMiddlewareFunction } from 'graphql-middleware';

import { AccessAPI } from '../../api/access.api';
import RequestError, { ForbiddenError, NotFoundError, UnauthenticatedError } from '../../errors/RequestErrors';
import { ResolverType } from '../../graphql.generated';
import { Logger } from '../../logger';
import { Context } from '../../models/context';
import { accessReducer } from '../../reducers/access.reducer';

const api = new AccessAPI();
const logger = Logger.getLogger('GqlAuthMiddleware');

const checkAuthMiddleware: IMiddlewareFunction<unknown, Context> = async (
  resolve,
  root,
  args,
  context,
  info,
) => {
  // Get the name of the resolver and if it's a query or mutation
  const resolverType =
    info.operation.operation === 'query' ? ResolverType.Query : ResolverType.Mutation;
  const resolverName = info.path.key.toString();

  if (resolverType && resolverName) {
    try {
      /** Get the mapped accessrequirements
       * @throws if no mapping (and will resolve below)
       */
      const access = await api.getAccessMapping(resolverName, resolverType);

      if (access.length === 0) {
        throw new NotFoundError(`Ingen accessmapping hittades för resursen ${resolverName}`);
      }

      const username = context.getUsername();

      // if user is not logged in
      if (!username) {
        return new UnauthenticatedError('Du måste logga in för att se denna resursen');
      }

      // If only login is required, (refresouce is null / '')
      if (access.some((a) => !a.refaccessresource)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return resolve(root, args, context, info);
      }

      const userAccess = await api.getUserFullAccess(username);
      const { web } = accessReducer(userAccess);

      // Map it so it's only the slugs
      const slugs = web.map((w) => w.slug);

      // If user does not have access, send back 403
      if (!access.some((r) => slugs.includes(r.refaccessresource))) {
        const requiredAccess = access.map((a) => a.refaccessresource).join(',');
        // eslint-disable-next-line @typescript-eslint/indent
        return new ForbiddenError(
          `Du måste ha någon av rollerna: [${requiredAccess}] för att komma åt denna resursen`,
        );
      }
    } catch (err) {
      // Catches any errors that occurs earlier on and just resolves the middleware
      logger.warn((err as RequestError).message);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return resolve(root, args, context, info);
};

// Only run middlewares on queries and mutations
export const authMiddleware: IMiddleware = {
  Query: checkAuthMiddleware,
  Mutation: checkAuthMiddleware,
};
