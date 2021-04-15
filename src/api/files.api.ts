import { createHash } from 'crypto';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs';
import { extname } from 'path';

import config from '../config';
import { AccessType, File, FileType } from '../graphql.generated';
import { FileSystemNodeResponse } from '../models/mappers';
import { FILES_TABLE } from './constants';
import knex from './knex';

export type FileModel = Omit<File, 'createdBy' | 'url'> & {
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
  async saveFile(file: UploadedFile, accessType: AccessType): Promise<FileModel> {
    const date = new Date();

    const type = this.getFileType(file.name);

    // Generate hashed name from filename and current date, this way a unique file will be created on every upload
    const hashedName =
      createHash('md5')
        .update(file.name + date.valueOf().toString())
        .digest('hex') + extname(file.name);

    const typeFolder = `${type.toLowerCase()}s`;
    const folder = `${ROOT}/${typeFolder}`;
    const location = `${folder}/${hashedName}`;

    // Create folder(s) if it doesn't exist
    if (!ROOT) {
      fs.mkdirSync(ROOT);
    }

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }

    await file.mv(location);

    const newFile: FileModel = {
      id: hashedName,
      name: file.name,
      type: type,
      // TODO: create ref to uploader using auth
      refuploader: 'aa0000bb-s',
      folderLocation: `${typeFolder}/${hashedName}`,
      accessType,
    };

    await knex<FileModel>(FILES_TABLE).insert(newFile);

    return newFile;
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

    const location = `${ROOT}/${file.folderLocation}`;

    // Delete file from system
    fs.rmSync(location);

    // Delete file from DB
    await knex<FileModel>(FILES_TABLE).where('id', id).delete();

    return true;
  }

  async getMultipleFiles(type?: FileType) {
    if (type) {
      return knex<FileModel>(FILES_TABLE).where('fileType', type);
    } else {
      return knex<FileModel>(FILES_TABLE);
    }
  }

  /**
   * Gets a files data
   * @param id Id of the file to fetch
   * @returns FileData
   */
  async getFileData(id: string) {
    const file = await knex<FileModel>(FILES_TABLE).where('id', id).first();

    if (!file) {
      return null;
    }

    return file;
  }

  async getFileFromName(name: string) {
    const file = await knex<FileModel>(FILES_TABLE).where('name', name).first();
    return file;
  }

  /**
   * Helper method to get Enum value of file type
   * @param name Name of the file, including extension
   * @returns Enumvalue for filetype
   */
  getFileType(name: string) {
    const ext = extname(name);

    const REGEX: Record<string, RegExp> = {
      [FileType.Image]: /[\/.](gif|jpg|jpeg|tiff|png)$/i,
      [FileType.Pdf]: /[\/.](pdf)$/i,
      [FileType.Text]: /[\/.](txt|doc|docx)$/i,
      [FileType.Code]: /[\/.](html|htm|js|ts|jsx|tsx|tex)$/i,
      [FileType.Powerpoint]: /[\/.](ppt)$/i,
      [FileType.Spreadsheet]: /[\/.](xlx|xlsx|xls)$/i,
    };

    for (const type in REGEX) {
      if (ext.match(REGEX[type])) {
        return type as FileType;
      }
    }

    return FileType.Other;
  }

  /**
   * Gets all items in provided folder
   * @param folder The path to the directory
   * @returns List of folder/files
   */

  async getFolderData(folder: string): Promise<FileSystemNodeResponse[]> {
    let folderTrimmed = folder.replace('..', ''); // Remove '..' so that you cant go back further

    const res: FileSystemNodeResponse[] = [];

    if (folderTrimmed[0] === '/') {
      folderTrimmed = folderTrimmed.substring(1);
    }

    const fullPath = `${ROOT}/${folderTrimmed}`;

    try {
      const files = fs.readdirSync(fullPath);
      for (const filename of files) {
        const stats = fs.statSync(`${fullPath}/${filename}`);

        if (stats.isDirectory()) {
          res.push({
            id: filename,
            name: filename,
            createdAt: stats.birthtime,
            accessType: AccessType.Public,
            type: FileType.Folder,
            size: stats.size,
            url: `${ENDPOINT}/${folder}/${filename}`,
            folderLocation: `${folder}/${filename}`,
            createdBy: {
              username: 'aa0000bb-s',
            },
          } as FileSystemNodeResponse);

          continue;
        }

        const dbData = await this.getFileData(filename);

        if (!dbData) {
          continue; // Skippa ifall filen inte finns i DB
        }

        res.push({
          id: dbData.id,
          name: dbData.name,
          createdAt: stats.birthtime,
          accessType: dbData.accessType,
          type: dbData.type,
          size: stats.size,
          url: `${ENDPOINT}/${folder}/${filename}`,
          folderLocation: `${folder}/${filename}`,
          createdBy: {
            username: dbData.refuploader,
          },
        });
      }
      return res;
    } catch (err) {
      console.error(err);
      return [];
    }
  }
}

export default FilesAPI;
