import config from '@/config';
import { FileResponse } from '@/models/mappers';
import { AccessType, FileType } from '@generated/graphql';
import { PrismaFile } from '@prisma/client';
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
export const fileReduce = (file: PrismaFile): FileResponse => {
  const { size } = statSync(`${ROOT}/${file.folderLocation}`);
  return {
    ...file,
    url: `${ENDPOINT}${file.folderLocation}`,
    createdBy: {
      username: file.refUploader,
    },
    size,
    type: file.type as FileType,
    accessType: file.accessType as AccessType,
  };
};
