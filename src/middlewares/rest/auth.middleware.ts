import { NextFunction, Request, Response } from 'express';

import FilesAPI from '../../api/files.api';
import { verifyToken } from '../../auth';
import { AccessType, User } from '../../graphql.generated';
import { Logger } from '../../logger';

const logger = Logger.getLogger('RestAuth');

export type Middleware = (req: Request, res: Response, next: NextFunction) => void;

export const verifyAuthenticated: Middleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[0]; // Bearer abc....

  if (!token) {
    res.status(401).send('Missing JWT token in Authorization header');
    return;
  }

  try {
    const verifiedToken = verifyToken<User>(token);
    if (!verifiedToken) {
      throw new Error();
    }
  } catch {
    res.status(401).send('Token could not be verified');
  }

  next();
};

export const verifyFileReadAccess = (api: FilesAPI): Middleware => (req, res, next) => {
  // IIFE because .use does not expect a promise
  (async () => {
    const { url } = req;
    const id = url.substr(url.lastIndexOf('/') + 1).split('?')[0];
    const file = await api.getFileData(id);

    const jwtToken: string =
      req.headers.authorization?.split(' ')[0] ?? req.query?.token?.toString() ?? ''; // Get token from cookie, query-param or header

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
      if (!jwtToken) {
        throw new Error('Missing JWT token in access restricted file');
      }

      const token = verifyToken<User>(jwtToken);

      if (file.accessType === AccessType.Admin && token) {
        // TODO: Verify that user is admin
        next();
        return;
      }

      if (file.accessType === AccessType.Authenticated && token) {
        next();
        return;
      }

      // If none of the above verifications succeeded, user is not authorized
      throw new Error('Verification for file restriction failed');
    } catch (error) {
      // Return 403 if no token was provided or it verification failed
      logger.error(`Error in verification middleware - ${error as string}`);

      res.status(403).send('Access Denied');
    }
  })();
};
