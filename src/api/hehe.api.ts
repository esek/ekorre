import config from '@/config';
import { NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, createPageInfo, devGuard } from '@/util';
import { AccessType, FileType, Order, PageInfo, PaginationParams } from '@generated/graphql';
import { PrismaHehe } from '@prisma/client';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs/promises';
import path from 'path';
import { pdf } from 'pdf-to-img';

import FileAPI from './file.api';
import prisma from './prisma';

const {
  FILES: { ENDPOINT, ROOT },
  HEHES: { COVER_FOLDER },
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
   * Retrieves HeHEs by pagination, ordered by year and then number (in the inverted order)
   * @param pagination The pagination parameters
   * @returns A list containing the PageInfo and the PrismaHehe objects, which can then be reduced
   */
  async getHehesByPagination(pagination?: PaginationParams): Promise<[PageInfo, PrismaHehe[]]> {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
    const order = pagination?.order ?? Order.Desc;

    if (page < 1 || pageSize < 1) {
      throw new ServerError('Sidnummer och HeHEs per sida måste vara större än 0');
    }

    if (pageSize > MAX_PAGE_SIZE) {
      throw new ServerError('Kan inte hämta fler än 200 HeHEs per sida');
    }

    const [count, hehes] = await prisma.$transaction([
      prisma.prismaHehe.count(),
      prisma.prismaHehe.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ year: order }, { number: order === Order.Desc ? Order.Asc : Order.Desc }],
      }),
    ]);

    const pageInfo = createPageInfo(page, pageSize, count);

    return [pageInfo, hehes];
  }

  /**
   * Creates a cover image for a HeHE edition from a PDF
   * @param uploaderUsername Username of the uploader
   * @param fileId ID of the file containing the PDF
   * @param number Number of the paper
   * @param year What year the paper was published
   * @returns ID of the created cover image file
   */
  async createHeheCover(uploaderUsername: string, fileId: string): Promise<string> {
    const file = await fileApi.getFileData(fileId);

    // If no file is provided
    if (!file) {
      logger.debug(`File ${fileId} can not be found`);
      throw new NotFoundError('Filen kunde inte hittas, vilket kan bero på att den inte finns');
    }

    if (file.type !== FileType.Pdf) {
      logger.debug('File is not a PDF');
      throw new ServerError('Filen är inte en PDF');
    }

    // Get the PDF to convert to a PNG
    const pdfPath = `${ROOT}/${file.folderLocation}`;
    const document = await pdf(pdfPath);

    // If no pages are found
    if (document.length === 0) {
      logger.debug('PDF appears to have no pages');
      throw new ServerError('Den uppladdade PDFen verkar inte ha några sidor');
    }

    const coverName = `${path.parse(file.name).name}.png`; // Parses the HeHE file name to get the cover name
    const accessType = AccessType.Public;
    let coverId = '';

    // Creates the cover image as an UploadedFile and then saves it to the database
    for await (const page of document) {
      const uploadedFile = this.createUploadedFile(page, coverName, 'image/png');
      const coverFile = await fileApi.saveFile(
        uploadedFile,
        accessType,
        COVER_FOLDER,
        uploaderUsername,
      );
      coverId = coverFile.id;

      break; // Only creates an image from the first page of the PDF
    }

    if (coverId === '') {
      logger.debug('Could not create cover image');
      throw new ServerError('Kunde inte skapa omslagsbild');
    }

    return coverId;
  }

  /**
   * Adds a new edition/paper of HeHE
   * @param uploaderUsername Username of the uploader
   * @param fileId ID of the file containing this paper
   * @param coverId ID of the file containing the cover image of this paper
   * @param number Number of the paper
   * @param year What year the paper was published
   */
  async addHehe(
    uploaderUsername: string,
    fileId: string,
    coverId: string,
    number: number,
    year: number,
  ): Promise<boolean> {
    const file = await fileApi.getFileData(fileId);

    // If no file is provided
    if (!file) {
      logger.debug(`File ${fileId} can not be found`);
      throw new NotFoundError('Filen kunde inte hittas, vilket kan bero på att den inte finns');
    }

    if (file.type !== FileType.Pdf) {
      logger.debug('File is not a PDF');
      throw new ServerError('Filen är inte en PDF');
    }

    try {
      await prisma.prismaHehe.create({
        data: {
          refUploader: uploaderUsername,
          refFile: fileId,
          coverEndpoint: `${ENDPOINT}/${COVER_FOLDER}/`,
          coverId,
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
    const hehe = await prisma.prismaHehe.findFirst({
      where: {
        year,
        number,
      },
    });

    if (!hehe) {
      logger.debug(`Could not find HeHE number ${number} for year ${year}`);
      throw new ServerError(
        'Kunde inte hitta upplagan av HeHE, vilket kan bero på att den inte finns',
      );
    }

    // Try to remove the cover image
    try {
      await fileApi.deleteFile(hehe.coverId);
      logger.info(`Deleted cover image for HeHE number ${number} for year ${year}`);
    } catch (err) {
      logger.error(err);
      logger.error(
        `Failed to remove existing cover image for HeHE number ${number} for year ${year}`,
      );
    }

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
   * Creates an UploadedFile object from a buffer, for use with the file API
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

  /**
   * Removes all HeHEs from the database.
   *
   * Not callable in a production environment
   */
  async clear() {
    devGuard('Tried to clear accesses in production!');

    await prisma.prismaHehe.deleteMany();
  }
}
