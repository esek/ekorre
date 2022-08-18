/* eslint-disable class-methods-use-this */
import { BadRequestError, NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { devGuard } from '@/util';
import { AccessType, MeetingDocumentType, MeetingType } from '@generated/graphql';
import { Prisma, PrismaMeeting, PrismaMeetingType } from '@prisma/client';

import prisma from './prisma';

const logger = Logger.getLogger('MeetingAPI');

export class MeetingAPI {
  /**
   * Hämtar alla möten efter en sortering.
   * Retrieves all meetings according to sort ordering
   * @param limit Max number of meetings to retrieve
   * @param sortOrder Sort order for retrieval
   */
  async getAllMeetings(limit = 20, sortOrder: 'desc' | 'asc' = 'desc'): Promise<PrismaMeeting[]> {
    const m = await prisma.prismaMeeting.findMany({
      orderBy: [{ type: sortOrder }, { year: sortOrder }, { number: sortOrder }],
      take: limit,
    });

    return m;
  }

  /**
   * Retrieves a meeting
   * @param id ID for the meeting
   * @throws {NotFoundError} If the meeting could not be found
   */
  async getSingleMeeting(id: number): Promise<PrismaMeeting> {
    const m = await prisma.prismaMeeting.findFirst({ where: { id } });

    if (m == null) {
      throw new NotFoundError('Mötet kunde inte hittas');
    }

    return m;
  }

  /**
   * Retrieves multiple meetings from the database, with possible specifics, ordered
   * by type first, then year and finally number
   * @param year Year of the meeting
   * @param number The number of the meeting, if applicable
   * @param type The type of meeting
   * @returns A list of meetings
   */
  async getMultipleMeetings(
    year?: number,
    number?: number,
    type?: MeetingType,
  ): Promise<PrismaMeeting[]> {
    const whereAnd: Prisma.PrismaMeetingWhereInput[] = [];

    if (year != null) {
      whereAnd.push({ year });
    }
    if (number != null) {
      whereAnd.push({ number });
    }
    if (type != null) {
      whereAnd.push({ type: type as unknown as PrismaMeetingType });
    }

    const m = await prisma.prismaMeeting.findMany({
      where: {
        AND: whereAnd,
      },
      orderBy: [{ type: 'desc' }, { year: 'desc' }, { number: 'desc' }],
    });

    if (m === null) {
      throw new ServerError('Mötessökningen misslyckades');
    }

    return m;
  }

  /**
   * Retrieves the latest board meetings, ordered
   * by type first, then year and finally number
   * @param limit The number of board meetings to be returned. If `null`, all board meetings are returned
   */
  async getLatestBoardMeetings(limit?: number): Promise<PrismaMeeting[]> {
    const m = await prisma.prismaMeeting.findMany({
      where: {
        type: 'SM',
      },
      orderBy: [{ type: 'desc' }, { year: 'desc' }, { number: 'desc' }],
      take: limit,
    });

    if (m === null) {
      throw new ServerError('Mötessökningen misslyckades');
    }

    return m;
  }

  /**
   * Creates a new meeting
   * Skapar ett nytt möte. Misslyckas om mötet redan existerar
   * @param type The type of meeting
   * @param number The number of the meeting. If `null`, it will be number of the latest meeting for that year plus one
   * @param year The year of the meeting. If `null`, it will be assumed to be the current year
   * @returns The created meeting
   */
  async createMeeting(type: MeetingType, number?: number, year?: number): Promise<PrismaMeeting> {
    // Use current year if none is given
    const safeYear = (Number.isSafeInteger(year) ? year : new Date().getFullYear()) as number;

    // If it is a board meeting, or a extra guild meeting (extrainsatt sektionsmöte),
    // it must have a number. If not provided we get it from the DB
    let safeNbr: number;
    if (number == null || !Number.isSafeInteger(number)) {
      const lastMeeting = await prisma.prismaMeeting.findFirst({
        where: { year },
        select: { number: true },
        orderBy: [{ number: 'desc' }],
      });

      if (lastMeeting == null) {
        // If we can't find a previous meeting, this is the first
        // for this year
        safeNbr = 1;
      } else {
        safeNbr = lastMeeting.number + 1;
      }
    } else {
      safeNbr = number;
    }

    // We want this to be an atomic operation to avoid race conditions.
    // Since number might or might not be set by database, we just handle race
    // conditions from meetings created at the same time as a normal double
    return prisma.$transaction(async (p) => {
      // Check for double
      const possibleDouble = await p.prismaMeeting.findFirst({
        where: {
          type: type === undefined ? undefined : (type as PrismaMeetingType),
          number: safeNbr,
          year: safeYear,
        },
      });

      if (possibleDouble != null) {
        throw new BadRequestError('Mötet finns redan!');
      }

      try {
        const meeting = await p.prismaMeeting.create({
          data: {
            type: type as PrismaMeetingType,
            number: safeNbr,
            year: safeYear,
          },
        });

        if (meeting == null) {
          throw new ServerError('Mötet kunde inte skapas!');
        }

        return meeting;
      } catch (err) {
        const logStr = `Failed to create meeting with values: ${Logger.pretty({
          type,
          number,
          year,
        })} due to error: ${JSON.stringify(err)}`;
        logger.error(logStr);
        throw new ServerError('Attans! Mötet kunde inte skapas!');
      }
    });
  }

  /**
   * Removes a meeting
   * @param id ID of the meeting
   * @returns If the meeting was successfully removed
   * @throws {NotFoundError} If the meeting could not be found
   */
  async removeMeeting(id: number): Promise<boolean> {
    try {
      await prisma.prismaMeeting.delete({ where: { id } });
      return true;
    } catch {
      throw new NotFoundError('Mötet kunde inte hittas');
    }
  }

  /**
   * Attempts to add/attach a file to a meeting as a form of document. Requires
   * the file access type to be set to public
   * @param meetingId ID of the meeting
   * @param fileId ID of the file to be attached
   * @param fileType Type of file (documents, late documents etc.)
   * @throws {ServerError} If the meeting does not exist
   * @throws {BadRequestError} If this filetype already has an attached file for this meeting, or the file is not public
   */
  async addFileToMeeting(
    meetingId: number,
    fileId: string,
    fileType: MeetingDocumentType,
  ): Promise<boolean> {
    const d = this.createDataForMeetingType(fileType, fileId);
    const w = this.createDataForMeetingType(fileType, { not: null });

    // Once again avoiding race conditions
    await prisma.$transaction(async (p) => {
      const possibleDouble = await p.prismaMeeting.findFirst({
        where: {
          ...w,
          id: meetingId,
        },
      });

      if (possibleDouble != null) {
        throw new BadRequestError(`Detta möte har redan en fil av typen ${fileType}`);
      }

      const file = await p.prismaFile.findFirst({
        where: {
          id: fileId,
        },
      });

      if (file?.accessType !== AccessType.Public) {
        throw new BadRequestError('Filen måste vara publik');
      }

      try {
        await p.prismaMeeting.update({
          data: {
            ...d,
          },
          where: {
            id: meetingId,
          },
        });
      } catch {
        throw new ServerError('Detta möte verkar inte finnas!');
      }
    });

    return true;
  }

  /**
   * Attempts to remove a document from a meeting. Returns `true` if the meeting
   * was found and the reference for this document type is guaranteed to be `null` in the
   * database.
   *
   * *Note:* This does not actually remove the file from the file system, only makes it
   * unrelated to this meeting
   *
   * *Trivia:* Also known as *Annas Method*, this method was created specifically
   * because Ordförande 2021 Anna Hollsten loved to upload documents as protocols and
   * vice versa. The old website had no function to remove documents, meaning the poor
   * Informationschef had to do this manually in phpMyAdmin...
   * @param meetingId ID of the meeting
   * @param fileType The type of file to be removed
   * @returns If the file could be removed for the meeting
   */
  async removeFileFromMeeting(meetingId: number, fileType: MeetingDocumentType): Promise<boolean> {
    const d = this.createDataForMeetingType(fileType, null);
    try {
      await prisma.prismaMeeting.update({
        data: {
          ...d,
        },
        where: {
          id: meetingId,
        },
      });

      return true;
    } catch {
      throw new ServerError(
        `Kunde inte ta bort mötesdokument, troligen existerar inte mötet med id ${meetingId}`,
      );
    }
  }

  /**
   * Creates a data object for updating using Prisma, by binding a file type to
   * the correct reference (i.e. `MeetingDocumentType.Summons` -> `{ refSummons: content }`)
   *
   * @param fileType The type of file for the meeting
   * @param content Either `fileId` or null if the file is to be removed, or undefined if checking if document exists
   */
  private createDataForMeetingType(
    fileType: MeetingDocumentType,
    content: string | { not: string | null } | null | undefined,
  ) {
    let data = {};
    switch (fileType) {
      case MeetingDocumentType.Summons:
        data = {
          refSummons: content,
        };
        break;
      case MeetingDocumentType.Documents:
        data = {
          refDocuments: content,
        };
        break;
      case MeetingDocumentType.LateDocuments:
        data = {
          refLateDocuments: content,
        };
        break;
      case MeetingDocumentType.Protocol:
        data = {
          refProtocol: content,
        };
        break;
      case MeetingDocumentType.Appendix:
        data = {
          refAppendix: content,
        };
        break;
      default:
        break;
    }

    return data;
  }

  /**
   * Clears all meetings from the database
   *
   * Only usable in dev, and will fail if called in an production environment
   */
  async clear() {
    devGuard('Cannot clear meeting history in production');

    await prisma.prismaMeeting.deleteMany();
  }
}
