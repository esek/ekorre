import { NextFunction, Request, Response, Router, static as staticFiles } from 'express';
import upload, { UploadedFile } from 'express-fileupload';

import FilesAPI from '../api/files.api';
import { verifyToken } from '../auth';
import config from '../config';
import { AccessType, User } from '../graphql.generated';
import { Logger } from '../logger';

const filesRoute = Router();

const filesAPI = new FilesAPI();

const logger = Logger.getLogger('Files');

interface UploadFileRequest {
  body: {
    path?: string;
    accessType?: AccessType;
  };
  files: {
    file?: UploadedFile[];
  };
}

/**
 * HTTP POST endpoint for handling uploading of files
 * Requests are to be sent using FormData with a parameter of `file`
 * containing the file to upload
 *
 * Type and path parameters can be supplied in FormData body
 *
 * @default `type`: AccessType.Public
 * @default `path`: '/'
 */

filesRoute.post('/upload', upload(), async (req, res) => {
  const { body, files } = req as UploadFileRequest;

  if (!files?.file) {
    // If no file is provided, send HTTP status 400
    return res.status(400).send('File missing');
  }

  const file = files.file instanceof Array ? files.file[0] : files.file;
  const accessType = (body?.accessType as AccessType) ?? AccessType.Public;
  const path = body?.path ?? '/';
  // TODO: Fix ref
  const dbFile = await filesAPI.saveFile(file, accessType, path, 'aa0000bb-s');

  return res.send(dbFile);
});

/**
 * Middleware used by static files to ensure the user
 * has sufficient read parameters to view a file
 *
 * @returns HTTP status 200 if user has access
 * @returns HTTP status 403 if user does not have access
 * @returns HTTP status 404 if the file does not exist
 */

const verifyReadAccess = (req: Request, res: Response, next: NextFunction) => {
  // IIFE because .use does not expect a promise
  (async () => {
    const { url } = req;
    const id = url.substr(url.lastIndexOf('/') + 1).split('?')[0];
    const file = await filesAPI.getFileData(id);

    const jwtToken: string = req.headers.authorization ?? req.query?.token?.toString() ?? ''; // Get token from cookie, query-param or header

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

// Host static files
filesRoute.use('/', verifyReadAccess, staticFiles(config.FILES.ROOT));

export default filesRoute;
