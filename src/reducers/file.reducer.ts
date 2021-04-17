import { statSync } from 'fs';

import { FileModel } from '../api/files.api';
import config from '../config';
import { FileResponse } from '../models/mappers';

const {
  FILES: { ENDPOINT, ROOT },
} = config;

export function hydrateFiles(file: FileModel): FileResponse;
export function hydrateFiles(file: FileModel[]): FileResponse[];
export function hydrateFiles(file: FileModel | FileModel[]): FileResponse | FileResponse[] {
  return file instanceof Array ? file.map(map) : map(file);
}

const map = (file: FileModel) => {
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
