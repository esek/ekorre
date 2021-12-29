/* eslint-disable class-methods-use-this */
import { BadRequestError, NotFoundError, ServerError } from '../errors/RequestErrors';
import { MeetingDocumentType, MeetingType } from '../graphql.generated';
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
   * @param limit antal styrelsemöten som ska returneras. Om null
   * returneras alla
   */
  async getLatestBoardMeetings(limit?: number): Promise<DatabaseMeeting[]> {
    const query = knex<DatabaseMeeting>(MEETING_TABLE)
      .where({ type: MeetingType.Sm })
      .orderBy('number', 'desc')
      .orderBy('year', 'desc');

    if (limit != null) {
      query.limit(limit);
    }

    const m = await query;

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
   * @returns ID på skapat möte
   */
  async createMeeting(type: MeetingType, number?: number, year?: number): Promise<string> {
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
        safeNbr = lastNbr.number + 1;
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
      const meetingId = (await knex<DatabaseMeeting>(MEETING_TABLE).insert({
        type,
        number: safeNbr,
        year: safeYear,
      }, 'id'))[0];

      if (meetingId == null) {
        throw new Error();
      }

      return meetingId;
    } catch (err) {
      const logStr = `Failed to create meeting with values: ${Logger.pretty({
        type,
        number,
        year,
      })} due to error: ${JSON.stringify(err)}`;
      logger.error(logStr);
      throw new ServerError('Attans! Mötet kunde inte skapas!');
    }
  }

  /**
   * Tar bort ett möte
   * @param id Mötes-ID
   * @throws `NotFoundError` om mötet ej kunde tas bort
   */
  async removeMeeting(id: string): Promise<boolean> {
    const res = await knex<DatabaseMeeting>(MEETING_TABLE).delete().where({ id });

    if (res === 0) {
      throw new NotFoundError('Mötet kunde inte hittas');
    }

    return true;
  }

  /**
   * Försöker lägga till en fil till ett möte.
   * Ger `ServerError` om filen redan finns för detta mötet
   * @param meetingId
   * @param fileId
   * @param fileType
   * @throws `ServerError`
   */
  async addFileToMeeting(
    meetingId: string,
    fileId: string,
    fileType: MeetingDocumentType,
  ): Promise<boolean> {
    const ref = `ref${fileType}`;

    // Uppdaterar mötesdokumentet för ett möte,
    // om detta dokument inte redan finns
    const res = await knex<DatabaseMeeting>(MEETING_TABLE)
      .where('id', meetingId)
      .whereNull(ref)
      .update(ref, fileId);
    if (res === 0) {
      throw new ServerError(
        `Antingen finns detta möte inte, eller så finns dokument av typen ${fileType} redan på detta möte!`,
      );
    }

    return true;
  }

  /**
   * Försöker ta bort ett dokument från ett möte. Returnerar true
   * om mötet hittades och referensen till denna dokumenttypen garanterat
   * är `null` i databasen.
   *
   * Även kännt som _Annas Metod_, denna skapades specifikt för att
   * Ordförande 2021 Anna Hollsten älskade att ladda upp handlingar
   * som protokoll och vice versa, och den gamla hemsidan hade ingen
   * funktion för att ta bort dokument...
   * @param meetingId
   * @param fileType
   */
  async removeFileFromMeeting(meetingId: string, fileType: MeetingDocumentType): Promise<boolean> {
    const ref = `ref${fileType}`;
    const res = await knex<DatabaseMeeting>(MEETING_TABLE).where('id', meetingId).update(ref, null);
    if (res === 0) {
      throw new ServerError(
        `Kunde inte ta bort mötesdokument, troligen existerar inte mötet med id ${meetingId}`,
      );
    }

    return true;
  }
}
