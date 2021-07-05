import { statSync } from 'fs';

import config from '../config';
import { DatabaseFile } from '../models/db/file';
import { FileResponse } from '../models/mappers';

const {
  FILES: { ENDPOINT, ROOT },
} = config;

/**
 * Maps `FileModel` to `FileResponse` and reads the filesize
 * from the filesystem
 *
 * @param file FileModel to map
 * @returns `FileResponse` object with reference to creator
 */
export const fileReduce = (file: DatabaseFile): FileResponse => {
  const { size } = statSync(`${ROOT}/${file.folderLocation}`);
  return {
    ...file,
    url: `${ENDPOINT}${file.folderLocation}`,
    createdBy: {
      username: file.refuploader,
    },
    size,
  };
};
