import { createHash } from 'crypto';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs';
import { extname } from 'path';

import config from '../config';
import { AccessType, File, FileSystemResponsePath, FileType } from '../graphql.generated';
import { Logger } from '../logger';
import { FILES_TABLE } from './constants';
import knex from './knex';

export type FileModel = Omit<File, 'createdBy' | 'url' | 'size'> & {
  refuploader: string;
};

const {
  FILES: { ROOT },
} = config;

const logger = Logger.getLogger('Files');

class FilesAPI {
  /**
   * Saves a new file to the server
   * @param file The file to save
   * @param type What type of file it is
   * @param path Where to save the file
   * @param creator Username of the creator of the file
   * @returns A `FileModel` object with the data of the saved file
   */
  async saveFile(
    file: UploadedFile,
    accessType: AccessType,
    path: string,
    creator: string,
  ): Promise<FileModel> {
    const type = this.getFileType(file.name);

    const hashedName = this.createHashedName(file.name);

    const trimmedPath = this.trimFolder(path);

    const folder = `${ROOT}/${trimmedPath}`;
    const location = `${folder}${hashedName}`;

    // Create folder(s) if it doesn't exist
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    // Move file to correct location
    await file.mv(location);

    // Save file to DB with hashedName as id and folderLocation
    // pointing to the location in storage
    const newFile: FileModel = {
      id: hashedName,
      name: file.name,
      refuploader: creator,
      folderLocation: `${trimmedPath}${hashedName}`,
      accessType,
      createdAt: new Date(),
      type,
    };

    await knex<FileModel>(FILES_TABLE).insert(newFile);

    return newFile;
  }

  /**
   * Creates a folder on the filesystem
   * @param folder The directory in which to save the folder
   * @param name Name of the folder
   * @param creator Username of the creator of the folder
   * @returns `true` if folder was created, otherwise `false`
   */
  async createFolder(folder: string, name: string, creator: string) {
    const folderTrimmed = this.trimFolder(folder);
    const hash = this.createHashedName(name);
    const fullPath = `${ROOT}/${folderTrimmed}${hash}`;

    try {
      // Create folder in storage
      fs.mkdirSync(fullPath, { recursive: true });

      const dbData: FileModel = {
        id: hash,
        accessType: AccessType.Public,
        createdAt: new Date(),
        folderLocation: `${folderTrimmed}${hash}`,
        name,
        refuploader: creator,
        type: FileType.Folder,
      };

      const res = await knex<FileModel>(FILES_TABLE).insert(dbData);

      logger.info(`Created folder ${name} with hash ${hash}`);

      return res.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Deletes file from `Files` DB and removes it from the system
   * @param id File id
   * @returns A boolean indicating if the deletion was a success
   */
  async deleteFile(id: string) {
    // Get file from DB
    const file = await this.getFileData(id);

    if (!file) {
      return false;
    }

    const location = `${ROOT}/${file.folderLocation}`;

    // Delete file from system
    fs.rmSync(location, { recursive: true });

    // Delete file from DB
    await knex<FileModel>(FILES_TABLE).where('id', id).delete();

    logger.info(`Deleted ${file.type} ${file.name}`);

    return true;
  }

  async getMultipleFiles(type?: FileType) {
    if (type) {
      return knex<FileModel>(FILES_TABLE).where('type', type);
    }
    return knex<FileModel>(FILES_TABLE);
  }

  /**
   * Gets a files data
   * @param id Id of the file to fetch
   * @returns FileData
   */
  async getFileData(id: string): Promise<FileModel | null> {
    const file = await knex<FileModel>(FILES_TABLE).where('id', id).first();

    if (!file) {
      return null;
    }

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
      [FileType.Image]: /[/.](gif|jpg|jpeg|tiff|png|svg)$/i,
      [FileType.Pdf]: /[/.](pdf)$/i,
      [FileType.Text]: /[/.](txt|doc|docx)$/i,
      [FileType.Code]: /[/.](html|htm|js|ts|jsx|tsx|tex)$/i,
      [FileType.Powerpoint]: /[/.](ppt)$/i,
      [FileType.Spreadsheet]: /[/.](xlx|xlsx|xls)$/i,
    };

    const type = Object.keys(REGEX).find((k) => RegExp(REGEX[k]).exec(ext)) as FileType | undefined;

    if (!type) {
      logger.warn(`No matching FileType found for ${ext}`);
    }

    return type ?? FileType.Other;
  }

  /**
   * Gets all items in provided folder
   * @param folder The path to the directory
   * @returns List of folder/files
   */
  async getFolderData(folder: string): Promise<[FileModel[], FileSystemResponsePath[]]> {
    const folderTrimmed = this.trimFolder(folder);

    try {
      // Get path for current directory
      const fullPath = `${ROOT}${folderTrimmed === '/' ? '' : `/${folderTrimmed}`}`;

      // Get all folders in the path
      const pathNames = folderTrimmed.split('/').filter((p) => p);

      // Get details for all folders from DB
      const dbPaths = await knex<FileModel>(FILES_TABLE)
        .where('id', 'in', pathNames)
        .select('id', 'name');

      // Read files in current directory
      const fileIds = fs.readdirSync(fullPath);

      // If no files, return empty array
      if (!fileIds?.length) {
        return [[], dbPaths];
      }

      // Get details for all files in current directory from DB
      const files = await knex<FileModel>(FILES_TABLE).where('id', 'in', fileIds);

      return [files, dbPaths];
    } catch (err) {
      return [[], []];
    }
  }

  /**
   * Helper to ensure folder name is formatted as /\<foldername>/
   *
   * Excluding root, which should always be /
   *
   * @param folder folder to format
   * @returns Correctly formatted foldername
   */
  private trimFolder(folder: string) {
    let trimmed = folder.replace('..', '').trim();

    if (trimmed.charAt(0) !== '/') {
      trimmed = `/${trimmed}`;
    }

    if (trimmed.charAt(trimmed.length - 1) !== '/') {
      trimmed = `${trimmed}/`;
    }

    return trimmed;
  }

  /**
   * Generates an md5 hash consisting of a string and the current date
   * to ensure that it will always be unique
   * @param name The string to hash
   * @returns Random unique md5 hash
   */
  private createHashedName(name: string) {
    const date = new Date();

    const hashedName =
      createHash('md5')
        .update(name + date.valueOf().toString())
        .digest('hex') + extname(name);

    return hashedName;
  }
}

export default FilesAPI;