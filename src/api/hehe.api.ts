import config from '@/config';
import { NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { devGuard } from '@/util';
import { AccessType } from '@generated/graphql';
import { PrismaHehe } from '@prisma/client';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs/promises';
import { pdfToPng } from 'pdf-to-png-converter';

import FileAPI from './file.api';
import prisma from './prisma';

const {
  FILES: { ENDPOINT, ROOT },
} = config;

const fileApi = new FileAPI();

const logger = Logger.getLogger('HeheAPI');

export class HeheAPI {
  /**
   * Retrieves all editions of HeHE, ordered by year and then number
   * @param limit The number of HeHEs to be returned, if `undefined`/`null`, all HeHEs are returned
   * @param sortOrder Ordering of returned HeHEs
   */
  async getAllHehes(limit?: number, sortOrder: 'desc' | 'asc' = 'desc'): Promise<PrismaHehe[]> {
    const h = await prisma.prismaHehe.findMany({
      orderBy: [{ year: sortOrder }, { number: sortOrder }],
      take: limit,
    });

    return h;
  }

  /**
   * Retrieves a specific edition of HeHE
   * @param number Number of the paper
   * @param year What year the paper was published
   */
  async getHehe(number: number, year: number): Promise<PrismaHehe> {
    const h = await prisma.prismaHehe.findFirst({
      where: {
        year,
        number,
      },
    });

    if (h == null) {
      throw new NotFoundError('Kunde inte hitta detta nummer av HeHE!');
    }

    return h;
  }

  /**
   * Retrieves all HeHEs from a specific year, ordered by number
   * @param year
   */
  async getHehesByYear(year: number): Promise<PrismaHehe[]> {
    const h = await prisma.prismaHehe.findMany({
      where: {
        year,
      },
      orderBy: {
        number: 'desc',
      },
    });

    return h;
  }

  /**
   * Adds a new edition/paper of HeHE
   * @param uploaderUsername Username of the uploader
   * @param fileId ID of the file containing this paper
   * @param number Number of the paper
   * @param year What year the paper was published
   */
  async addHehe(
    uploaderUsername: string,
    fileId: string,
    number: number,
    year: number,
  ): Promise<boolean> {
    const file = await fileApi.getFileData(fileId);

    // If no file is provided
    if (!file) {
      logger.debug(`File ${fileId} can not be found`);
      return false;
    }

    if (file.type !== 'PDF') {
      logger.debug('File is not a PDF');
      return false;
    }

    // Convert the cover of the PDF to a PNG
    const pdfPath = `${ROOT}/${file.folderLocation}`;
    const pages = await pdfToPng(pdfPath, {
      pagesToProcess: [1], // Only process the first page
    });

    // If no pages are found
    if (pages.length === 0) {
      logger.debug('PDF appears to have no pages');
      return false;
    }

    // Creates the image as an UploadedFile and then saves it to the database
    const imageFile = this.createUploadedFile(
      pages[0].content,
      `${year}-${number}.png`,
      'image/png',
    );

    const path = 'hehe-covers';
    const accessType = AccessType.Public;
    const dbFile = await fileApi.saveFile(imageFile, accessType, path, uploaderUsername);

    try {
      await prisma.prismaHehe.create({
        data: {
          refUploader: uploaderUsername,
          refFile: fileId,
          photoUrl: `${ENDPOINT}${dbFile.folderLocation}`,
          number,
          year,
        },
      });
      return true;
    } catch (err) {
      logger.debug(
        `Could not upload HeHE number ${number} for year ${year} due to error:\n\t${JSON.stringify(
          err,
        )}`,
      );
      throw new ServerError(
        'Kunde inte lägga till upplagan av HeHE, vilket kan bero på att den redan finns',
      );
    }
  }

  /**
   * Attempts to remove an edition of HeHE
   * @param number Number of the paper
   * @param year What year the paper was published
   */
  async removeHehe(number: number, year: number): Promise<boolean> {
    try {
      await prisma.prismaHehe.delete({
        where: {
          // Key is tuple
          year_number: {
            number,
            year,
          },
        },
      });
      return true;
    } catch {
      logger.debug(`Could not delete HeHE number ${number} for year ${year}`);
      throw new ServerError(
        'Kunde inte radera upplagan av HeHE, vilket kan bero på att den inte finns',
      );
    }
  }

  /**
   * Removes all HeHEs from the database.
   *
   * Not callable in a production environment
   */
  async clear() {
    devGuard('Tried to clear accesses in production!');

    await prisma.prismaHehe.deleteMany();
  }

  /**
   * Creates an UploadedFile object from a buffer, for use with the file API
   *
   * @param data Buffer with the file's data
   * @param name Name of the file
   * @param type MIME type
   * @returns
   */
  private createUploadedFile(data: Buffer, name: string, type: string): UploadedFile {
    const file: UploadedFile = {
      name,
      data,
      size: data.byteLength,
      encoding: '7bit',
      tempFilePath: '',
      truncated: false,
      mimetype: type,
      md5: '',
      mv: async (newPath: string): Promise<void> => {
        return fs.writeFile(newPath, data);
      },
    };

    return file;
  }
}
