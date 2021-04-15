import { createHash } from 'crypto';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs';
import { extname } from 'path';

import config from '../config';
import { AccessType, File, FileSystemNodeType, FileType } from '../graphql.generated';
import { FILES_TABLE } from './constants';
import knex from './knex';

export type FileModel = Omit<File, 'uploadedBy' | 'id'> & {
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
  async saveFile(file: UploadedFile, type: FileType, accessType: AccessType): Promise<FileModel> {
    const date = new Date();

    // Generate hashed name from filename and current date, this way a unique file will be created on every upload
    const hashedName =
      createHash('md5')
        .update(file.name + date.valueOf().toString())
        .digest('hex') + extname(file.name);

    const typeFolder = `${type.toLowerCase()}s`;
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
      location: `${typeFolder}/${hashedName}`,
      accessType,
    };

    const ids = await knex<FileModel>(FILES_TABLE).insert(newFile);

    return {
      ...newFile,
      location: `${ENDPOINT}/${newFile.location}`,
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

  async getMultipleFiles(type?: FileType) {
    let files = [];

    if (type) {
      files = await knex<FileModel>(FILES_TABLE).where('fileType', type);
    } else {
      files = await knex<FileModel>(FILES_TABLE);
    }

    return files.map((f) => ({ ...f, location: `${ENDPOINT}/${f.location}` }));
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

    return { ...file, location: `${ENDPOINT}/${file.location}` };
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
  getFileSystemType(name: string) {
    const ext = extname(name);

    const REGEX: Record<string, RegExp> = {
      [FileSystemNodeType.Image]: /[\/.](gif|jpg|jpeg|tiff|png)$/i,
      [FileSystemNodeType.Pdf]: /[\/.](pdf)$/i,
      [FileSystemNodeType.TextFile]: /[\/.](txt|doc|docx)$/i,
    };

    // Svinfult, kom gärna med förslag till förbättring
    if (ext.match(REGEX[FileSystemNodeType.Image])) {
      return FileSystemNodeType.Image;
    }

    if (ext.match(REGEX[FileSystemNodeType.Pdf])) {
      return FileSystemNodeType.Pdf;
    }

    if (ext.match(REGEX[FileSystemNodeType.TextFile])) {
      return FileSystemNodeType.TextFile;
    }

    return FileSystemNodeType.Other;
  }

  /**
   * Gets all items in provided folder
   * @param folder The path to the directory
   * @returns List of folder/files
   */

  getFolderData(folder: string) {
    const folderTrimmed = folder[folder.length - 1] !== '/' ? folder : folder.slice(0, -1);
    const fullPath = `${ROOT}${folderTrimmed}`;

    try {
      const content = fs.readdirSync(fullPath).map((c) => {
        const stats = fs.statSync(`${fullPath}/${c}`);

        return {
          name: c,
          size: stats.size,
          lastUpdatedAt: stats.ctime,
          location: `${folderTrimmed}/${c}`,
          accessType: AccessType.Public,
          type: stats.isDirectory() ? FileSystemNodeType.Folder : this.getFileSystemType(c),
        };
      });

      return content;
    } catch {
      return [];
    }
  }
}

export default FilesAPI;
