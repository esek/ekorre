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
import { StrictObject } from '../models/base';
import type { DatabaseMeeting } from '../models/db/meeting';
import { validateNonEmptyArray } from '../services/validation.service';
import { MEETING_TABLE } from './constants';
import knex from './knex';

const logger = Logger.getLogger('MeetingAPI');

type GetMeetingParams = {
  type: Maybe<MeetingType>;
  number: Maybe<number>;
  year: Maybe<number>;
};

export class MeetingAPI {
  /**
   * Returnerar alla lagarade möten.
   */
  async getAllMeetings(): Promise<DatabaseMeeting[]> {
    const m = await knex<DatabaseMeeting>(MEETING_TABLE).select('*');
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
    // Ta bort undefined, de ogillas SKARPT  av Knex.js

    // Ts låter en inte indexera nycklar i params med foreach
    const copy: StrictObject = { ...params };
    Object.keys(copy).forEach((key) => (copy[key] === undefined ? delete copy[key] : {}));

    const m = await knex<DatabaseMeeting>(MEETING_TABLE).where(copy);

    if (m === null) {
      throw new NotFoundError('Inga möten kunde hittas');
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
      throw new NotFoundError('Inga styrelsemöten kunde hittas. Oops?');
    }

    return m;
  }

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
    let safeNbr;
    if ((type === MeetingType.Sm || type === MeetingType.Extra) && Number.isNaN(number)) {
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
        safeNbr = (lastNbr as number) + 1;
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

    if (possibleDouble !== null) {
      throw new BadRequestError('Mötet finns redan!');
    }

    await knex<DatabaseMeeting>(MEETING_TABLE).insert({
      type,
      number: safeNbr,
      year: safeYear,
    }).catch(() => {
      const logStr = `Failed to create meeting with values: ${Logger.pretty({type, number, year})}`;
      logger.error(logStr);
      throw new ServerError('Attans! Mötet kunde inte skapas!');
    });

    return true;
  }
}
