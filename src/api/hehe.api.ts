import { NotFoundError, ServerError } from '../errors/RequestErrors';
import { Logger } from '../logger';
import { DatabaseHeHe } from '../models/db/hehe';
import { validateNonEmptyArray } from '../services/validation.service';
import { HEHE_TABLE } from './constants';
import knex from './knex';

const logger = Logger.getLogger('HeHeAPI');

export class HeHeAPI {
  /**
   * Hämtar ett antal HeHE, sorterat efter nummer och år.
   * @param limit Antal HeHE som ska hämtas
   * @param sortOrder Hur nummer och år ska sorteras
   */
  async getAllHeHes(limit = 20, sortOrder: 'desc' | 'asc' = 'desc'): Promise<DatabaseHeHe[]> {
    const h = await knex<DatabaseHeHe>(HEHE_TABLE)
      .select('*')
      .orderBy('number', sortOrder)
      .orderBy('year', sortOrder)
      .limit(limit);

    validateNonEmptyArray(h, 'Hittade inga HeHE');

    return h;
  }

  /**
   * Hämtar en specifik upplaga av HeHE.
   * @param number Nummer på tidningen
   * @param year Vilket år tidningen publicerades
   */
  async getHeHe(number: number, year: number): Promise<DatabaseHeHe> {
    const h = await knex<DatabaseHeHe>(HEHE_TABLE)
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

  async getHehesByYear(year: number): Promise<DatabaseHeHe[]> {
    const h = await knex<DatabaseHeHe>(HEHE_TABLE).where({
      year,
    });

    validateNonEmptyArray(h, `Hittade inga HeHE för året ${year}`);

    return h;
  }

  /**
   * Lägger till ett nytt nummer av HeHE.
   * @param fileId ID på filen för detta nummer
   * @param number Nummer på tidningen
   * @param year Vilket år tidningen publicerades
   */
  async addHeHe(
    uploaderUsername: string,
    fileId: string,
    number: number,
    year: number,
  ): Promise<boolean> {
    try {
      await knex<DatabaseHeHe>(HEHE_TABLE).insert({
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
  async removeHeHe(number: number, year: number): Promise<boolean> {
    const res = await knex<DatabaseHeHe>(HEHE_TABLE).delete().where({
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
