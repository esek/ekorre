import config from '@/config';
import { FileResponse } from '@/models/mappers';
import { DatabaseFile } from '@db/file';
import { statSync } from 'fs';

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
