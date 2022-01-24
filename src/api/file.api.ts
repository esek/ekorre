import config from '@/config';
import { NotFoundError, ServerError } from '@/errors/RequestErrors';
import { Logger } from '@/logger';
import type { DatabaseFile } from '@db/file';
import { AccessType, FileSystemResponsePath, FileType } from '@generated/graphql';
import { createHash } from 'crypto';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs';
import { extname } from 'path';

import { FILE_TABLE } from './constants';
import db from './knex';

const {
  FILES: { ROOT },
} = config;

const logger = Logger.getLogger('Files');

class FileAPI {
  /**
   * Saves a new file to the server
   * @param file The file to save
   * @param type What type of file it is
   * @param path Where to save the file
   * @param creator Username of the creator of the file
   * @returns A `DatabaseFile` object with the data of the saved file
   */
  async saveFile(
    file: UploadedFile,
    accessType: AccessType,
    path: string,
    creator: string,
  ): Promise<DatabaseFile> {
    try {
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
      const newFile: DatabaseFile = {
        id: hashedName,
        name: file.name,
        refuploader: creator,
        folderLocation: `${trimmedPath}${hashedName}`,
        accessType,
        createdAt: new Date(),
        type,
      };

      await db<DatabaseFile>(FILE_TABLE).insert(newFile);

      return newFile;
    } catch (err) {
      logger.error(err);
      throw new ServerError('Kunde inte spara filen');
    }
  }

  /**
   * Creates a folder on the filesystem
   * @param folder The directory in which to save the folder
   * @param name Name of the folder
   * @param creator Username of the creator of the folder
   * @returns The location of the newly created folder
   */
  async createFolder(
    folder: string,
    name: string,
    creator: string,
    customHash?: string,
  ): Promise<string> {
    const folderTrimmed = this.trimFolder(folder);
    const hash = customHash ?? this.createHashedName(name);
    const fullPath = `${ROOT}/${folderTrimmed}${hash}`;

    try {
      // Create folder in storage
      fs.mkdirSync(fullPath, { recursive: true });

      const location = `${folderTrimmed}${hash}`;

      const dbData: DatabaseFile = {
        id: hash,
        accessType: AccessType.Public,
        createdAt: new Date(),
        folderLocation: location,
        name,
        refuploader: creator,
        type: FileType.Folder,
      };

      await db<DatabaseFile>(FILE_TABLE).insert(dbData);

      logger.info(`Created folder ${name} with hash ${hash}`);

      return location;
    } catch {
      throw new ServerError('Mappen kunde inte skapas');
    }
  }

  /**
   * Deletes file from `Files` DB and removes it from the system
   * @param id File id
   * @returns A boolean indicating if the deletion was a success
   */
  async deleteFile(id: string): Promise<void> {
    // Get file from DB
    const file = await this.getFileData(id);

    if (!file) {
      throw new NotFoundError('Filen kunde inte hittas');
    }

    const location = `${ROOT}/${file.folderLocation}`;

    // Delete file from system
    fs.rmSync(location, { recursive: true });

    // Delete file from DB
    await db<DatabaseFile>(FILE_TABLE)
      .where('id', id)
      .delete()
      .catch(() => {
        throw new ServerError('Kunde inte ta bort filen');
      });

    logger.info(`Deleted ${file.type} ${file.name}`);
  }

  async getMultipleFiles(type?: FileType) {
    const query = db<DatabaseFile>(FILE_TABLE);

    if (type) {
      query.where('type', type);
    }

    const files = await query;

    return files;
  }

  async getMultipleFilesById(ids: readonly string[]): Promise<DatabaseFile[]> {
    const f = await db<DatabaseFile>(FILE_TABLE).whereIn('id', ids);
    return f;
  }

  /**
   * Gets a files data
   * @param id Id of the file to fetch
   * @returns FileData
   */
  async getFileData(id: string): Promise<DatabaseFile> {
    const file = await db<DatabaseFile>(FILE_TABLE).where('id', id).first();

    if (!file) {
      throw new NotFoundError('Filen kunde inte hittas');
    }

    return file;
  }

  async searchFiles(search: string): Promise<DatabaseFile[]> {
    const files = await db<DatabaseFile>(FILE_TABLE)
      .whereNot({ type: FileType.Folder }) // dont include folders in search
      .andWhere('name', 'like', `%${search}%`)
      .orWhere('id', 'like', `%${search}%`);

    return files;
  }

  /**
   * Helper method to get Enum value of file type
   * @param name Name of the file, including extension
   * @returns Enumvalue for filetype
   */
  getFileType(name: string): FileType {
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
  async getFolderData(folder: string): Promise<[DatabaseFile[], FileSystemResponsePath[]]> {
    const folderTrimmed = this.trimFolder(folder);

    try {
      // Get path for current directory
      const fullPath = `${ROOT}${folderTrimmed === '/' ? '' : `/${folderTrimmed}`}`;

      // Get all folders in the path
      const pathNames = folderTrimmed.split('/').filter((p) => p);

      // Get details for all folders from DB
      const dbPaths = await db<DatabaseFile>(FILE_TABLE)
        .where('id', 'in', pathNames)
        .select('id', 'name');

      // Read files in current directory
      const fileIds = fs.readdirSync(fullPath);

      // If no files, return empty array
      if (!fileIds?.length) {
        return [[], dbPaths];
      }

      // Get details for all files in current directory from DB
      const files = await db<DatabaseFile>(FILE_TABLE).where('id', 'in', fileIds);

      return [files, dbPaths];
    } catch (err) {
      throw new ServerError('Kunde inte hämta filer');
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
  private trimFolder(folder: string): string {
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
  private createHashedName(name: string): string {
    const date = new Date();

    const hashedName =
      createHash('md5')
        .update(name + date.valueOf().toString())
        .digest('hex') + extname(name);

    return hashedName;
  }
}

export default FileAPI;
