import { NextFunction, Request, Response, Router, static as staticFiles } from 'express';
import upload from 'express-fileupload';

import FilesAPI from '../api/files.api';
import auth from '../auth';
import config from '../config';
import { AccessType, FileType } from '../graphql.generated';

const filesRoute = Router();

const filesAPI = new FilesAPI();

filesRoute.post('/upload', upload(), async ({ files, body }, res) => {
  if (files?.file) {
    const file = files.file instanceof Array ? files.file[0] : files.file;
    const fileType = (body?.fileType as FileType) ?? FileType.Other;
    const accessType = (body?.accessType as AccessType) ?? AccessType.Public;

    const dbFile = await filesAPI.saveFile(file, fileType, accessType);

    return res.send(dbFile);
  }
  return res.status(400).send('File missing');
});

const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  const { url } = req;
  const name = url.substr(url.lastIndexOf('/') + 1);
  const file = await filesAPI.getFileFromName(name);

  if (!file) {
    res.status(404).send();
    return;
  }
  try {
    const jwtToken: string = req.headers.authorization ?? req.cookies.token ?? req.query.token; // Get token from cookie, query-param or header

    if (!jwtToken) {
      throw new Error();
    }

    if (file.accessType !== AccessType.Public) {
      const token = auth.verifyToken(jwtToken);

      if (file.accessType === AccessType.Authenticated && !!token) {
        next();
        return;
      }
    }
  } catch {
    res.status(403).send('Access Denied');
    return;
  }

  res.status(404).send();
};

// Host static files
filesRoute.use('/', checkAuth, staticFiles(config.FILES.ROOT));

export default filesRoute;
