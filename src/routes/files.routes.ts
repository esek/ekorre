import { NextFunction, Request, Response, Router, static as staticFiles } from 'express';
import upload from 'express-fileupload';

import FilesAPI from '../api/files.api';
import config from '../config';
import { FileType } from '../graphql.generated';

const { FILES } = config;

const filesRoute = Router();

const filesAPI = new FilesAPI();

filesRoute.post('/upload', upload(), async (req, res) => {
  if (req.files?.file) {
    const file = req.files.file instanceof Array ? req.files.file[0] : req.files.file;
    const fileType = (req.body?.fileType as FileType) ?? FileType.Other;

    const dbFile = await filesAPI.saveFile(file, fileType);

    res.send(dbFile);
  } else {
    return res.status(400).send('File missing');
  }
});

//* Kanske göra om detta till en GraphQL mutation?
filesRoute.delete('/:id', async (req, res) => {
  const rm = await filesAPI.deleteFile(req.params.id);
  res.send(rm);
});

const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Add auth for files requests
  return next();
};

// Host static files
filesRoute.use('/', checkAuth, staticFiles(FILES.ROOT));

export default filesRoute;
