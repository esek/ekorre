/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { COOKIES, verifyToken } from '@/auth';
import { UnauthenticatedError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { TokenValue } from '@/models/auth';
import { AccessAPI } from '@api/access';
import FileAPI from '@api/file';
import { UserAPI } from '@api/user';
import { PrismaUser as User } from '@prisma/client';
import { AccessType, Feature } from '@generated/graphql';
import { accessReducer } from '@reducer/access';
import { RequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

const logger = Logger.getLogger('RestAuth');

const userApi = new UserAPI();
const accessApi = new AccessAPI();
const fileApi = new FileAPI();

/**
 * Express middleware to set a getUser helper method on res.locals.getUser
 */

/* eslint-disable @typescript-eslint/indent */
export type RequestHandlerWithLocals = RequestHandler<
  ParamsDictionary,
  unknown,
  unknown,
  { token?: string },
  { user: User; getUser: () => Promise<User> }
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

  res.locals.getUser = async () => {
    const { username } = verifyToken<TokenValue>(token, 'accessToken');
    return userApi.getSingleUser(username);
  };

  next();
};

/**
 * Express middleware to verify that a user is authenticated
 * also sets res.locals.user to the authenticated user on success
 */

export const verifyAuthenticated: RequestHandlerWithLocals = async (_req, res, next) => {
  try {
    const user = await res.locals.getUser();
    res.locals.user = user;
  } catch {
    res.status(401).send('Din token kunde inte valideras');
    return;
  }

  next();
};

/**
 * Express middleware to ensure that a user has the correct read access for a specific file
 */

export const verifyFileReadAccess: RequestHandlerWithLocals = async (req, res, next) => {
  // IIFE because .use does not expect a promise
  const { url } = req;
  const id = url.substring(url.lastIndexOf('/') + 1).split('?')[0];
  // return null if file doesn't exist
  const file = await fileApi.getFileData(id).catch(() => null);

  if (file == null) {
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
    const user = await res.locals.getUser();

    // If only login is required, proceed (authentication is checked beforehand)
    if (file.accessType === AccessType.Authenticated) {
      next();
      return;
    }

    // if admin is required
    if (file.accessType === AccessType.Admin) {
      const userAccess = await accessApi.getUserFullAccess(user.username);
      const { features } = accessReducer(userAccess);

      if (features.some((f) => [Feature.Superadmin, Feature.FilesAdmin].includes(f))) {
        next();
        return;
      }
    }

    // If none of tgithe above verifications succeeded, user is not authorized
    throw new UnauthenticatedError('Du har inte access');
  } catch (error) {
    // Return 403 if no token was provided or it verification failed
    logger.error(`Error in verification middleware - ${error as string}`);

    res.status(403).send('Access Denied');
  }
};
