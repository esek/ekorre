import { statSync } from 'fs';

import { FileModel } from '../api/files.api';
import config from '../config';

const {
  FILES: { ENDPOINT, ROOT },
} = config;

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
