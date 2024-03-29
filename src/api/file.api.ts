import config from '@/config';
import { NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { AccessType, FileSystemResponsePath, FileType } from '@generated/graphql';
import { Prisma, PrismaAccessType, PrismaFile } from '@prisma/client';
import { createHash } from 'crypto';
import { UploadedFile } from 'express-fileupload';
import syncFs from 'fs';
import fs from 'fs/promises';
import { extname } from 'path';

import prisma from './prisma';

const {
  FILES: { ROOT },
} = config;

const logger = Logger.getLogger('Files');

const defaultOrder: Prisma.PrismaFileOrderByWithRelationAndSearchRelevanceInput[] = [
  { name: 'asc' },
  { createdAt: 'desc' },
];

class FileAPI {
  /**
   * Saves a new file to the server
   * @param file The file to save
   * @param type What type of file it is
   * @param path Where to save the file
   * @param creator Username of the creator of the file
   * @returns A `PrismaFile` object with the data of the saved file
   */
  async saveFile(
    file: UploadedFile,
    accessType: AccessType,
    path: string,
    creator: string,
  ): Promise<PrismaFile> {
    const type = this.getFileType(file.name);

    const hashedName = this.createHashedName(file.name);

    const trimmedPath = this.trimFolder(path);

    const folder = `${ROOT}/${trimmedPath}`;
    const location = `${folder}${hashedName}`;

    try {
      // Create folder(s) if it doesn't exist
      if (!syncFs.existsSync(folder)) {
        await fs.mkdir(folder, { recursive: true });
      }

      // Move file to correct location
      await file.mv(location);

      // Save file to DB with hashedName as id and folderLocation
      // pointing to the location in storage
      const res = await prisma.prismaFile.create({
        data: {
          id: hashedName,
          name: file.name,
          folderLocation: `${trimmedPath}${hashedName}`,
          accessType: accessType as PrismaAccessType,
          refUploader: creator,
          type,
        },
      });

      return res;
    } catch (err) {
      logger.error(err);

      // We don't care if this fails since we can't do anything about it
      await fs.rm(location).catch(() => {});

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
  ): Promise<PrismaFile> {
    const folderTrimmed = this.trimFolder(folder);
    const hash = customHash ?? this.createHashedName(name);
    const fullPath = `${ROOT}/${folderTrimmed}${hash}`;

    try {
      // Create folder in storage
      await fs.mkdir(fullPath, { recursive: true });

      const location = `${folderTrimmed}${hash}`;

      const created = await prisma.prismaFile.create({
        data: {
          id: hash,
          name,
          folderLocation: location,
          accessType: PrismaAccessType.PUBLIC,
          refUploader: creator,
          type: FileType.Folder,
        },
      });

      logger.info(`Created folder ${name} with hash ${hash}`);

      return created;
    } catch {
      throw new ServerError('Mappen kunde inte skapas');
    }
  }

  /**
   * Deletes file from `Files` DB and removes it from the system
   * @param id File id
   * @returns A boolean indicating if the deletion was a success
   */
  async deleteFile(id: string): Promise<boolean> {
    // Get file from DB
    const file = await this.getFileData(id);

    if (!file) {
      throw new NotFoundError('Filen kunde inte hittas');
    }

    const location = `${ROOT}/${file.folderLocation}`;

    try {
      // Delete file from DB
      await prisma.prismaFile.delete({
        where: {
          id,
        },
      });

      // Delete file from system
      await fs.rm(location, { recursive: true });
      logger.info(`Deleted ${file.type} ${file.name}`);
      return true;
    } catch {
      throw new ServerError('Kunde inte ta bort filen');
    }
  }

  /**
   * Retrieves all files of the provided type, sorted first by name and then by creation date
   * @param type Type of files to retrieve
   */
  async getMultipleFiles(type?: FileType): Promise<PrismaFile[]> {
    const where: Prisma.PrismaFileWhereInput = {};

    if (type) {
      where.type = type;
    }

    const f = await prisma.prismaFile.findMany({
      where,
      orderBy: defaultOrder,
    });

    return f;
  }

  /**
   * Retrieves all files with ID as provided, sorted first by name and then by creation date
   * @param ids IDs of the files to retrieve
   */
  async getMultipleFilesById(ids: readonly string[]): Promise<PrismaFile[]> {
    const f = await prisma.prismaFile.findMany({
      where: {
        id: {
          in: ids.slice(), // Slice to copy readonly, required by prisma
        },
      },
      orderBy: defaultOrder,
    });

    return f;
  }

  /**
   * Gets a files data
   * @param id Id of the file to fetch
   * @returns FileData
   */
  async getFileData(id: string): Promise<PrismaFile> {
    const file = await prisma.prismaFile.findFirst({
      where: {
        id,
      },
    });

    if (!file) {
      throw new NotFoundError('Filen kunde inte hittas');
    }

    return file;
  }

  /**
   * Searches after files (names and IDs) that contains the search string,
   * ordered by relevance and creation date
   * @param search Search string
   */
  async searchFiles(search: string): Promise<PrismaFile[]> {
    const f = await prisma.prismaFile.findMany({
      where: {
        type: {
          not: FileType.Folder,
        },
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            id: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: [
        {
          _relevance: {
            fields: ['name', 'id'],
            search,
            sort: 'desc',
          },
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return f;
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
   * Retrieves folders and/or files in a folder, ordered by creation date
   * @param folder path to folder
   * @returns A list of folders and/or files
   */
  async getFolderData(folder: string): Promise<[PrismaFile[], FileSystemResponsePath[]]> {
    const folderTrimmed = this.trimFolder(folder);

    try {
      // Get path for current directory
      const fullPath = `${ROOT}${folderTrimmed === '/' ? '' : `/${folderTrimmed}`}`;

      // Get all folders in the path
      const pathNames = folderTrimmed.split('/').filter((p) => p);

      // Get details for all folders from DB
      const dbPaths = await prisma.prismaFile.findMany({
        select: {
          id: true,
          name: true,
        },
        where: {
          id: {
            in: pathNames,
          },
        },
        orderBy: {
          // Since we can't move files or folders, this will make breadcrumbs order correctly
          // (can't have a subfolder older than the one containing it)
          createdAt: 'asc',
        },
      });

      // Read files in current directory
      const fileIds = await fs.readdir(fullPath);

      // If no files, return empty array
      if (!fileIds?.length) {
        return [[], dbPaths];
      }

      // Get details for all files in current directory from DB
      const f = await prisma.prismaFile.findMany({
        where: {
          id: {
            in: fileIds,
          },
        },
        orderBy: defaultOrder,
      });

      return [f, dbPaths];
    } catch (err) {
      logger.error(err);
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
