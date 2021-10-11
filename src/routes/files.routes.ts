import { Router, static as staticFiles } from 'express';
import upload, { UploadedFile } from 'express-fileupload';

import FilesAPI from '../api/files.api';
import { UserAPI } from '../api/user.api';
import config from '../config';
import { AccessType } from '../graphql.generated';
import {
  setUser,
  verifyAuthenticated,
  verifyFileReadAccess,
} from '../middlewares/rest/auth.middleware';
import { reduce } from '../reducers';
import { fileReduce } from '../reducers/file.reducer';

const filesRoute = Router();

const filesAPI = new FilesAPI();
const userApi = new UserAPI();

export interface UploadFileRequest {
  body: {
    path?: string;
    accessType?: AccessType;
  };
  files: {
    file?: UploadedFile[];
  };
}

// Sets res.locals.getUser as a helper function for getting the current user
filesRoute.use(setUser);

/**
 * HTTP POST endpoint for handling uploading of files
 * Requests are to be sent using FormData with a parameter of `file`
 * containing the file to upload
 *
 * Type and path parameters can be supplied in FormData body
 *
 * @default `type`: AccessType.Public
 * @default `path`: '/'
 *
 * TODO: Fix auth for this endpoint -- who should be able to upload what type of file?
 */

filesRoute.post('/upload', upload(), verifyAuthenticated, async (req, res) => {
  const { body, files } = req as UploadFileRequest;

  if (!files?.file) {
    // If no file is provided, send HTTP status 400
    return res.status(400).send('File missing');
  }

  if (!res.locals.user) {
    return res.status(401).send('User missing');
  }

  const file = files.file instanceof Array ? files.file[0] : files.file;
  const accessType = body?.accessType ?? AccessType.Public;
  const path = body?.path ?? '/';
  const dbFile = await filesAPI.saveFile(file, accessType, path, res.locals.user.username);

  return res.send(dbFile);
});

filesRoute.post('/upload/avatar', upload(), verifyAuthenticated, async (req, res) => {
  const { files } = req as UploadFileRequest;

  if (!files?.file) {
    // If no file is provided, send HTTP status 400
    return res.status(400).send('File missing');
  }

  const username = res.locals.user?.username;

  if (!username) {
    return res.status(401).send();
  }

  let path = 'avatars';

  if (!(await filesAPI.getFileData('avatars'))) {
    const newPath = await filesAPI.createFolder('', path, username, path);

    if (!newPath) {
      return res.status(500).send('Could not create directory');
    }

    path = newPath;
  }

  const file = files.file instanceof Array ? files.file[0] : files.file;
  const accessType = AccessType.Authenticated;

  const dbFile = await filesAPI.saveFile(file, accessType, path, username);

  const success = await userApi.updateUser(username, { photoUrl: dbFile.folderLocation });

  if (!success) {
    return res.status(500).send('Could not update user image');
  }

  return res.send(reduce(dbFile, fileReduce));
});

// Host static files
filesRoute.use('/', verifyFileReadAccess(filesAPI), staticFiles(config.FILES.ROOT));

export default filesRoute;
