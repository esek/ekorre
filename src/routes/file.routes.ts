import config from '@/config';
import RequestError from '@/errors/request.errors';
import { Logger } from '@/logger';
import { reduce } from '@/reducers';
import { BYTES_PER_MB } from '@/util';
import FileAPI from '@api/file';
import { UserAPI } from '@api/user';
import { AccessType } from '@generated/graphql';
import { setUser, verifyAuthenticated, verifyFileReadAccess } from '@middleware/rest/auth';
import { fileReduce } from '@reducer/file';
import { Router, static as staticFiles } from 'express';
import upload, { UploadedFile } from 'express-fileupload';

const filesRoute = Router();

const fileApi = new FileAPI();
const userApi = new UserAPI();
const logger = Logger.getLogger('FileRoutes');

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

  const file = files.file instanceof Array ? files.file[0] : files.file;

  // Check file size (file.size is in bytes)
  const maxSize = config.FILES.MAX_FILE_UPLOAD_SIZE_BYTES;
  if (file.size > maxSize) {
    return res.status(400).send(`File too big, max is ${maxSize / BYTES_PER_MB} MB`);
  }

  const accessType = body?.accessType ?? AccessType.Public;
  const path = body?.path ?? '/';
  const dbFile = await fileApi.saveFile(file, accessType, path, res.locals.user.username);

  return res.send(reduce(dbFile, fileReduce));
});

filesRoute.post('/upload/avatar', upload(), verifyAuthenticated, async (req, res) => {
  const { files } = req as UploadFileRequest;

  if (!files?.file) {
    // If no file is provided, send HTTP status 400
    return res.status(400).send('File missing');
  }

  const file = files.file instanceof Array ? files.file[0] : files.file;

  // Check if file is too big (file.size is in bytes)
  const maxAvatarSize = config.FILES.MAX_AVATAR_SIZE_BYTES;
  const maxSize = config.FILES.MAX_FILE_UPLOAD_SIZE_BYTES;
  const sizeConstraint = Math.min(maxAvatarSize, maxSize);
  if (file.size > sizeConstraint) {
    return res.status(400).send(`Avatar too big, max is ${sizeConstraint / BYTES_PER_MB} MB`);
  }

  const { user } = res.locals;

  const { username, photoUrl } = user;

  // If user has an existing avatar, delete it
  if (photoUrl) {
    const existingFileId = photoUrl.split('/').pop() ?? ''; // Get the last part of the url (the file id)

    // remove the file
    try {
      await fileApi.deleteFile(existingFileId);
      logger.info(`Deleted existing avatar for user ${username}, fileId: ${existingFileId}`);
    } catch {
      logger.error(
        `Failed to remove existing avatar for user ${username}, fileId: ${existingFileId}`,
      );
    }
  }

  const path = 'avatars';

  const accessType = AccessType.Public;

  const dbFile = await fileApi.saveFile(file, accessType, path, username);

  try {
    await userApi.updateUser(username, { photoUrl: dbFile.folderLocation });
    return res.send(reduce(dbFile, fileReduce));
  } catch (e) {
    const error = e as RequestError;
    return res.status(error.code).send(error.message);
  }
});

// Host static files
filesRoute.use('/', verifyFileReadAccess, staticFiles(config.FILES.ROOT));

export default filesRoute;
