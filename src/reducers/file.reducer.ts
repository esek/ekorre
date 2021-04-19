import { statSync } from 'fs';

import { FileModel } from '../api/files.api';
import config from '../config';

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
export const fileReduce = (file: FileModel) => {
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
