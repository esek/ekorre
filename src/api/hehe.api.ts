import { NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { devGuard } from '@/util';
import { PrismaHehe } from '@prisma/client';

import prisma from './prisma';

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
    try {
      await prisma.prismaHehe.create({
        data: {
          refUploader: uploaderUsername,
          refFile: fileId,
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
}
