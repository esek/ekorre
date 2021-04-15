import { FileModel } from '../api/files.api';
import config from '../config';
import { FileResponse } from '../models/mappers';

const {
  FILES: { ENDPOINT },
} = config;

export function formatUrl(file: FileModel): FileResponse;
export function formatUrl(file: FileModel[]): FileResponse[];
export function formatUrl(file: FileModel | FileModel[]): FileResponse | FileResponse[] {
  if (file instanceof Array) {
    return file.map((f) => ({
      ...f,
      url: `${ENDPOINT}/${f.folderLocation}`,
      createdBy: {
        username: f.refuploader,
      },
    }));
  }

  return {
    ...file,
    url: `${ENDPOINT}/${file.folderLocation}`,
    createdBy: {
      username: file.refuploader,
    },
  };
}
