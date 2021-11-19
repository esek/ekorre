/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { RequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import FilesAPI from '../../api/files.api';
import { COOKIES, verifyToken } from '../../auth';
import { UnauthenticatedError } from '../../errors/RequestErrors';
import { AccessType, User } from '../../graphql.generated';
import { Logger } from '../../logger';

const logger = Logger.getLogger('RestAuth');

/**
 * Express middleware to set a getUser helper method on res.locals.getUser
 */

/* eslint-disable @typescript-eslint/indent */
export type RequestHandlerWithLocals = RequestHandler<
  ParamsDictionary,
  unknown,
  unknown,
  { token?: string },
  { user?: User; getUser: () => User }
>;

export const setUser: RequestHandlerWithLocals = (req, res, next) => {
  let token =
    (req.cookies[COOKIES.accessToken] as string) ??
    req.headers.authorization ??
    req.query?.token?.toString() ??
    '';

  // Remove `Bearer ` from token string
  if (token.includes('Bearer')) {
    token = token.replace('Bearer ', '');
  }

  res.locals.getUser = () => verifyToken<User>(token, 'accessToken');

  next();
};

/**
 * Express middleware to verify that a user is authenticated
 * also sets res.locals.user to the authenticated user on success
 */

export const verifyAuthenticated: RequestHandlerWithLocals = (_req, res, next) => {
  try {
    const user: User = res.locals.getUser();
    res.locals.user = user;

    if (!user) {
      throw new UnauthenticatedError('Inlogging krävs');
    }
  } catch {
    res.status(401).send('Din token kunde inte valideras');
    return;
  }

  next();
};

/**
 * Express middleware to ensure that a user has the correct read access for a specific file
 * @param api Files API
 */

export const verifyFileReadAccess =
  (api: FilesAPI): RequestHandlerWithLocals =>
  (req, res, next) => {
    // IIFE because .use does not expect a promise
    (async () => {
      const { url } = req;
      const id = url.substring(url.lastIndexOf('/') + 1).split('?')[0];
      // return null if file doesn't exist
      const file = await api.getFileData(id).catch((_) => null);

      if (!file) {
        logger.debug(`Could not find file '${id}' in DB`);
        res.status(404).send();
        return;
      }

      // If public file, just go to content
      if (file.accessType === AccessType.Public) {
        next();
        return;
      }

      try {
        const user: User = res.locals.getUser();

        if (file.accessType === AccessType.Admin && user) {
          // TODO: Verify that user is admin
          next();
          return;
        }

        if (file.accessType === AccessType.Authenticated && user) {
          next();
          return;
        }

        // If none of the above verifications succeeded, user is not authorized
        throw new UnauthenticatedError('Du har inte access');
      } catch (error) {
        // Return 403 if no token was provided or it verification failed
        logger.error(`Error in verification middleware - ${error as string}`);

        res.status(403).send('Access Denied');
      }
    })();
  };
