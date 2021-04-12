import { NextFunction, Request, Response, Router, static as staticFiles } from 'express';
import upload from 'express-fileupload';

import FilesAPI from '../api/files.api';
import config from '../config';
import { FileType } from '../graphql.generated';

const filesRoute = Router();

const filesAPI = new FilesAPI();

filesRoute.post('/upload', upload(), async ({ files, body }, res) => {
  if (files?.file) {
    const file = files.file instanceof Array ? files.file[0] : files.file;
    const fileType = (body?.fileType as FileType) ?? FileType.Other;

    const dbFile = await filesAPI.saveFile(file, fileType);

    return res.send(dbFile);
  }
  return res.status(400).send('File missing');
});

const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Add auth for files requests
  return next();
};

// Host static files
filesRoute.use('/', checkAuth, staticFiles(config.FILES.ROOT));

export default filesRoute;
