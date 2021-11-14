/* eslint-disable class-methods-use-this */
import { Maybe } from 'graphql/jsutils/Maybe';

import {
  BadRequestError,
  NotFoundError,
  ServerError,
  UnauthenticatedError,
} from '../errors/RequestErrors';
import { MeetingType } from '../graphql.generated';
import { Logger } from '../logger';
import type { DatabaseMeeting } from '../models/db/meeting';
import { stripObject } from '../util';
import { MEETING_TABLE } from './constants';
import knex from './knex';

const logger = Logger.getLogger('MeetingAPI');

type GetMeetingParams = {
  type?: MeetingType;
  number?: number;
  year?: number;
};

export class MeetingAPI {
  /**
   *
   * @param limit
   * @param sortOrder
   */
  async getAllMeetings(limit = 20, sortOrder: 'desc' | 'asc' = 'desc'): Promise<DatabaseMeeting[]> {
    const m = await knex<DatabaseMeeting>(MEETING_TABLE)
      .select('*')
      .orderBy('id', sortOrder)
      .limit(limit);
    return m;
  }

  /**
   * Hämta ett möte.
   * @param id det unika mötes-idt
   * @throws `NotFoundError` om mötet ej kan hittas
   */
  async getSingleMeeting(id: string): Promise<DatabaseMeeting> {
    const m = await knex<DatabaseMeeting>(MEETING_TABLE).where({ id }).first();

    if (m == null) {
      throw new NotFoundError('Mötet kunde inte hittas');
    }

    return m;
  }

  async getMultipleMeetings(params: GetMeetingParams): Promise<DatabaseMeeting[]> {
    const safeParams = stripObject(params);
    const m = await knex<DatabaseMeeting>(MEETING_TABLE).where(safeParams);

    if (m === null) {
      throw new ServerError('Mötessökningen misslyckades');
    }

    return m;
  }

  /**
   * Hämtar de senaste `limit` styrelsemötena
   * @param limit antal styrelsemöten som ska returneras
   */
  async getLatestBoardMeetings(limit: number): Promise<DatabaseMeeting[]> {
    const m = await knex<DatabaseMeeting>(MEETING_TABLE)
      .where({ type: MeetingType.Sm })
      .orderBy('number', 'desc')
      .orderBy('year', 'desc')
      .limit(limit);

    if (m === null) {
      throw new ServerError('Mötessökningen misslyckades');
    }

    return m;
  }

  /**
   * Skapar ett nytt möte. Misslyckas om mötet redan existerar
   * @param type
   * @param number
   * @param year
   */
  async createMeeting(
    type: MeetingType,
    number: Maybe<number>,
    year: Maybe<number>,
  ): Promise<boolean> {
    // Vi tar i år om inget år ges
    const safeYear = (Number.isSafeInteger(year) ? year : new Date().getFullYear()) as number;

    // Om det är ett Styrelsemöte eller extrainsatt sektionsmöte
    // måste det ha ett nummer. Om det inte är definierat hämtar
    // vi det från databasen
    let safeNbr = number;
    if (!Number.isSafeInteger(safeNbr)) {
      const lastNbr = await knex<DatabaseMeeting>(MEETING_TABLE)
        .select('number')
        .where({ type, year: safeYear })
        .orderBy('number', 'desc')
        .orderBy('year', 'desc')
        .first();

      if (lastNbr === undefined) {
        // Vi hittade inget tidigare möte detta året,
        // så detta är första
        safeNbr = 1;
      } else {
        safeNbr = (lastNbr.number as number) + 1;
      }
    }

    // Kontrollera att vi inte har dubblettmöte
    const possibleDouble = await knex<DatabaseMeeting>(MEETING_TABLE)
      .where({
        type,
        number: safeNbr,
        year: safeYear,
      })
      .first();

    if (possibleDouble !== undefined) {
      throw new BadRequestError('Mötet finns redan!');
    }

    try {
      await knex<DatabaseMeeting>(MEETING_TABLE).insert({
        type,
        number: safeNbr,
        year: safeYear,
      });
    } catch (err) {
      const logStr = `Failed to create meeting with values: ${Logger.pretty({
        type,
        number,
        year,
      })}`;
      logger.error(logStr);
      throw new ServerError('Attans! Mötet kunde inte skapas!');
    }
    return true;
  }
}
