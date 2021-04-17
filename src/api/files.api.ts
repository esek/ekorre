import { createHash } from 'crypto';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs';
import { extname } from 'path';

import config from '../config';
import { AccessType, File, FileSystemResponsePath, FileType } from '../graphql.generated';
import { FILES_TABLE } from './constants';
import knex from './knex';

export type FileModel = Omit<File, 'createdBy' | 'url' | 'size'> & {
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
  async saveFile(file: UploadedFile, accessType: AccessType, path: string): Promise<FileModel> {
    const date = new Date();

    const type = this.getFileType(file.name);

    const hashedName = this.createHashedName(file.name);

    const trimmedPath = this.trimFolder(path);

    const folder = `${ROOT}/${trimmedPath}`;
    const location = `${folder}${hashedName}`;

    // Create folder(s) if it doesn't exist
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    await file.mv(location);

    const newFile: FileModel = {
      id: hashedName,
      name: file.name,
      type,
      // TODO: create ref to uploader using auth
      refuploader: 'aa0000bb-s',
      folderLocation: `${trimmedPath}${hashedName}`,
      accessType,
      createdAt: date,
    };

    await knex<FileModel>(FILES_TABLE).insert(newFile);

    return newFile;
  }

  async createFolder(folder: string, name: string, creator: string) {
    const folderTrimmed = this.trimFolder(folder);
    const hash = this.createHashedName(name);
    const fullPath = `${ROOT}/${folderTrimmed}${hash}`;

    if (fs.existsSync(fullPath)) {
      return false;
    }

    try {
      fs.mkdirSync(fullPath, { recursive: true });

      const dbData: FileModel = {
        id: hash,
        accessType: AccessType.Public,
        createdAt: new Date(),
        folderLocation: `${folderTrimmed}${hash}`,
        name: name,
        // TODO: Fix ref
        refuploader: creator,
        type: FileType.Folder,
      };

      const res = await knex<FileModel>(FILES_TABLE).insert(dbData);

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

    for (const type of Object.keys(REGEX)) {
      if (RegExp(REGEX[type]).exec(ext)) {
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

  async getFolderData(folder: string): Promise<[FileModel[], FileSystemResponsePath[]]> {
    const folderTrimmed = this.trimFolder(folder);

    try {
      const fullPath = `${ROOT}${folderTrimmed === '/' ? '' : `/${folderTrimmed}`}`;

      const pathNames = folderTrimmed.split('/');

      const dbPaths = await knex<FileModel>(FILES_TABLE).where(
        'id',
        'in',
        pathNames.filter((pn) => pn),
      );

      const paths = dbPaths.map((p) => ({ name: p.name, id: p.id }));

      const fileIds = fs.readdirSync(fullPath);

      if (!fileIds?.length) {
        return [[], paths];
      }

      const files = await knex<FileModel>(FILES_TABLE).where('id', 'in', fileIds);

      return [files, paths];
    } catch (err) {
      return [[], []];
    }
  }

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
