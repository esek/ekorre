/* eslint-disable class-methods-use-this */
import { BadRequestError, NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { devGuard } from '@/util';
import { AccessType, Maybe, MeetingDocumentType, MeetingType } from '@generated/graphql';
import { Prisma, PrismaMeeting, PrismaMeetingType } from '@prisma/client';

import prisma from './prisma';

const logger = Logger.getLogger('MeetingAPI');

export class MeetingAPI {
  /**
   * Hämtar alla möten efter en sortering.
   * @param limit Begränsning på hur många möten som ska hämtas
   * @param sortOrder Sorteringsordning för hämtningen
   */
  async getAllMeetings(limit = 20, sortOrder: 'desc' | 'asc' = 'desc'): Promise<PrismaMeeting[]> {
    const m = await prisma.prismaMeeting.findMany({
      orderBy: [{ year: sortOrder }, { number: sortOrder }],
      take: limit,
    });

    return m;
  }

  /**
   * Hämta ett möte.
   * @param id Det unika mötes-idt
   * @throws `NotFoundError` om mötet ej kan hittas
   */
  async getSingleMeeting(id: number): Promise<PrismaMeeting> {
    const m = await prisma.prismaMeeting.findFirst({ where: { id } });

    if (m == null) {
      throw new NotFoundError('Mötet kunde inte hittas');
    }

    return m;
  }

  /**
   * Hämta flertalet möte ur databasen, genom ökad specifitet
   * @param year det år som möten ska hämtas från
   * @param number det nummer som möten ska hämtas från
   * @param type typen av möte som ska hämtas
   * @returns
   */
  async getMultipleMeetings(
    year?: Maybe<number>,
    number?: Maybe<number>,
    type?: Maybe<MeetingAPI>,
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
    });

    if (m === null) {
      throw new ServerError('Mötessökningen misslyckades');
    }

    return m;
  }

  /**
   * Hämtar de senaste `limit` styrelsemötena ordnade nummer och år
   * @param limit Antal styrelsemöten som ska returneras. Om null
   * returneras alla
   */
  async getLatestBoardMeetings(limit?: number): Promise<PrismaMeeting[]> {
    const m = await prisma.prismaMeeting.findMany({
      where: {
        type: 'SM',
      },
      orderBy: [{ number: 'desc' }, { year: 'desc' }],
      take: limit,
    });

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
  async createMeeting(type: MeetingType, number?: number, year?: number): Promise<PrismaMeeting> {
    // Vi tar i år om inget år ges
    const safeYear = (Number.isSafeInteger(year) ? year : new Date().getFullYear()) as number;

    // Om det är ett Styrelsemöte eller extrainsatt sektionsmöte
    // måste det ha ett nummer. Om det inte är definierat hämtar
    // vi det från databasen
    let safeNbr: number;
    if (number == null || !Number.isSafeInteger(number)) {
      const lastMeeting = await prisma.prismaMeeting.findFirst({
        where: { year },
        select: { number: true },
        orderBy: [{ number: 'desc' }],
      });

      if (lastMeeting == null) {
        // Vi hittade inget tidigare möte detta året,
        // så detta är första
        safeNbr = 1;
      } else {
        safeNbr = lastMeeting.number + 1;
      }
    } else {
      safeNbr = number;
    }

    // Vi vill att dessa queries och checkar ska köras direkt
    // efter varandra i databasen, så att inget smiter imellan
    return prisma.$transaction(async (p) => {
      // Kontrollera att vi inte har dubblettmöte
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
   * Tar bort ett möte
   * @param id Mötes-ID
   * @throws `NotFoundError` om mötet ej kunde tas bort
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
   * Försöker lägga till en fil till ett möte.
   * Ger `ServerError` om filen redan finns för detta mötet
   * @param meetingId
   * @param fileId
   * @param fileType
   * @throws `ServerError`
   */
  async addFileToMeeting(
    meetingId: number,
    fileId: string,
    fileType: MeetingDocumentType,
  ): Promise<boolean> {
    const d = this.createDataForMeetingType(fileType, fileId);
    const w = this.createDataForMeetingType(fileType, { not: null });

    // Vi kollar om detta dokumentet redan finns, och om det gör
    // det så ger vi ett error (i en transaction för att undvika race conditions)
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
