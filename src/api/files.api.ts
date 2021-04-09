import { createHash } from 'crypto';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs';
import { extname } from 'path';

import config from '../config';
import { File, FileType } from '../graphql.generated';
import { FILES_TABLE } from './constants';
import knex from './knex';

export type FileModel = Omit<File, 'size' | 'uploadedBy' | 'id'> & {
  id?: string;
  refuploader: string;
};

const {
  FILES: { ROOT, ENDPOINT },
} = config;

class FilesAPI {
  /**
   * Saves a new file to the server
   * @param file The file to save
   * @param type What type of file it is
   * @returns A `FileModel` object with the data of the saved file
   */
  async saveFile(file: UploadedFile, type: FileType): Promise<FileModel> {
    const date = new Date();

    // Generate hashed name from filename and current date, this way a unique file will be created on every upload
    const hashedName =
      createHash('md5')
        .update(file.name + date.valueOf().toString())
        .digest('hex') + extname(file.name);

    const typeFolder = type.toLowerCase() + 's';
    const folder = `${ROOT}/${typeFolder}`;
    const location = `${folder}/${hashedName}`;

    // Create folder if it doesn't exist
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }

    await file.mv(location);

    const newFile: FileModel = {
      name: hashedName,
      createdAt: date,
      lastUpdatedAt: date,
      fileType: type,
      // TODO: create ref to uploader using auth
      refuploader: 'aa0000bb-s',
      location: `${ENDPOINT}/${typeFolder}/${hashedName}`,
    };

    const ids = await knex<FileModel>(FILES_TABLE).insert(newFile);

    return {
      ...newFile,
      id: ids[0].toString(),
    };
  }

  /**
   * Deletes file from `Files` DB and removes it from the system
   * @param id File id
   * @returns A boolean indicating if the deletion was a success
   */
  async deleteFile(id: string) {
    const file = await this.getFileData(id);

    if (!file) {
      return false;
    }

    const location = file.location.replace(ENDPOINT, ROOT);

    // Delete file from system
    fs.rmSync(location);

    // Delete file from DB
    await knex<FileModel>(FILES_TABLE).where('id', id).delete();

    return true;
  }

  /**
   * Gets a files data
   * @param id Id of the file to fetch
   * @returns FileData
   */
  async getFileData(id: string) {
    const file = await knex<FileModel>(FILES_TABLE).where('id', id).first();

    return file;
  }
}

export default FilesAPI;
