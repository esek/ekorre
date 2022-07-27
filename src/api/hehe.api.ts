import { NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { devGuard } from '@/util';
import { PrismaHehe } from '@prisma/client';

import prisma from './prisma';

const logger = Logger.getLogger('HeheAPI');

export class HeheAPI {
  /**
   * Hämtar ett antal HeHE, sorterat efter först år och sen nummer.
   * @param limit Antal HeHE som ska hämtas, om `undefined`/`null` ges alla
   * @param sortOrder Hur nummer och år ska sorteras
   */
  async getAllHehes(limit?: number, sortOrder: 'desc' | 'asc' = 'desc'): Promise<PrismaHehe[]> {
    const h = await prisma.prismaHehe.findMany({
      orderBy: [{ year: sortOrder }, { number: sortOrder }],
      take: limit,
    });

    return h;
  }

  /**
   * Hämtar en specifik upplaga av HeHE.
   * @param number Nummer på tidningen
   * @param year Vilket år tidningen publicerades
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
   * Hämta alla HeHes från ett specifikt år ordnat efter nummer.
   * @param year
   * @returns en lista med HeHes
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
   * Lägger till ett nytt nummer av HeHE.
   * @param fileId ID på filen för detta nummer
   * @param number Nummer på tidningen
   * @param year Vilket år tidningen publicerades
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
   * Försöker ta bort en upplaga av HeHE.
   * @param number Nummer på tidningen
   * @param year Vilket år tidningen publicerades
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
