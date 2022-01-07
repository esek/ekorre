import { NotFoundError, ServerError } from '../errors/RequestErrors';
import { Logger } from '../logger';
import { DatabaseHehe } from '../models/db/hehe';
import { HEHE_TABLE } from './constants';
import db from './knex';

const logger = Logger.getLogger('HeheAPI');

export class HeheAPI {
  /**
   * Hämtar ett antal HeHE, sorterat efter först år och sen nummer.
   * @param limit Antal HeHE som ska hämtas, om `undefined`/`null` ges alla
   * @param sortOrder Hur nummer och år ska sorteras
   */
  async getAllHehes(limit?: number, sortOrder: 'desc' | 'asc' = 'desc'): Promise<DatabaseHehe[]> {
    const query = db<DatabaseHehe>(HEHE_TABLE)
      .orderBy('year', sortOrder)
      .orderBy('number', sortOrder);

    if (limit != null) {
      query.limit(limit);
    }

    const h = await query;

    return h;
  }

  /**
   * Hämtar en specifik upplaga av HeHE.
   * @param number Nummer på tidningen
   * @param year Vilket år tidningen publicerades
   */
  async getHehe(number: number, year: number): Promise<DatabaseHehe> {
    const h = await db<DatabaseHehe>(HEHE_TABLE)
      .where({
        number,
        year,
      })
      .first();

    if (h == null) {
      throw new NotFoundError('Kunde inte hitta detta nummer av HeHE!');
    }

    return h;
  }

  async getHehesByYear(year: number): Promise<DatabaseHehe[]> {
    const h = await db<DatabaseHehe>(HEHE_TABLE).where({
      year,
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
      await db<DatabaseHehe>(HEHE_TABLE).insert({
        refuploader: uploaderUsername,
        reffile: fileId,
        number,
        year,
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
    const res = await db<DatabaseHehe>(HEHE_TABLE).delete().where({
      number,
      year,
    });

    if (res < 1) {
      logger.debug(`Could not delete HeHE number ${number} for year ${year}`);
      throw new ServerError(
        'Kunde inte radera upplagan av HeHE, vilket kan bero på att den inte finns',
      );
    }

    return true;
  }
}
