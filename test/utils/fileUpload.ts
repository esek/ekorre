import config from '@/config';
import FileAPI from '@api/file';
import { resolve } from 'path';
import request from 'supertest';

export type UploadFileOptions = {
  withFile?: boolean;
  withAuth?: boolean;
};

export const path = (fileName: string) => resolve(__dirname, '../data', fileName);
export const baseURL = (endpoint: string) => `${config.FILES.ENDPOINT}/${endpoint}`;

/**
 * Base function for uploading a file
 *
 * @param accessToken Token to use for authentication
 * @param endpoint What endpoint to upload to
 * @param filename Name of the file to upload
 * @param r Request object
 * @param opts Options for the upload
 * @returns Request object with the file attached
 */
export const baseUploadFile = (
  accessToken: string,
  endpoint: string,
  filename: string,
  r: request.SuperTest<request.Test>,
  opts: UploadFileOptions,
) => {
  const req = r.post(baseURL(endpoint)).field('name', filename);
  const { withFile = true, withAuth = true } = opts;

  if (withFile) {
    req.attach('file', path(filename));
  }

  if (withAuth) {
    req.set({ Authorization: `Bearer ${accessToken}` });
  }

  return req;
};

/**
 * Remove all uploaded files containing the string 'test'
 *
 * @param fileApi File API instance
 * @returns Promise with all removed files
 */
export const removeUploadedFiles = async (fileApi: FileAPI) => {
  const removes = await fileApi.searchFiles('test');
  return Promise.all(removes.map((f) => fileApi.deleteFile(f.id)));
};
