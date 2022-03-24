/* eslint-disable @typescript-eslint/indent */
import { BadRequestError, NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { reduce } from '@/reducers';
import { NominationAnswer } from '@generated/graphql';
import {
  Prisma,
  PrismaElectable,
  PrismaElection,
  PrismaNomination,
  PrismaNominationAnswer,
  PrismaProposal,
} from '@prisma/client';

import prisma from './prisma';

const logger = Logger.getLogger('ElectionAPI');

type RawDbNomination = {
  ref_election: number,
  ref_post: string,
  answer: PrismaNominationAnswer,
  ref_user: string,
};

export class ElectionAPI {
  /**
   * Converts raw nomination rows to `PrismaNomination[]`
   */
  reduceRawDbNominations(rows: RawDbNomination[]): PrismaNomination[] {
    const res: PrismaNomination[] = rows.map((r) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { ref_election, ref_post, ref_user, ...reduced } = r;

      return {
        ...reduced,
        refElection: ref_election,
        refPost: ref_post,
        refUser: ref_user,
      };
    });

    return res;
  }

  /**
   * @param limit Gräns på antal möten. Om null ges alla möten
   * @returns Senaste mötet som skapades
   */
  async getLatestElections(
    limit?: number,
    includeUnopened = true,
    includeHiddenNominations = true,
  ): Promise<PrismaElection[]> {
    const e = await prisma.prismaElection.findMany({
      where: {
        open: includeUnopened ? undefined : true,
        nominationsHidden: includeHiddenNominations ? undefined : false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return e;
  }

  /**
   * @returns Senaste mötet markerat som `open`
   * @throws `NotFoundError`
   */
  async getOpenElection(): Promise<PrismaElection> {
    const e = await prisma.prismaElection.findFirst({
      where: {
        open: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (e == null) {
      throw new NotFoundError('Hittade inga öppna val');
    }

    return e;
  }

  /**
   * Returnerar en lista med alla val som matchar något av de angivna ID:n.
   * @param electionIds En lista med `electionId`
   * @returns En lista med val
   */
  async getMultipleElections(electionIds: number[] | readonly number[]): Promise<PrismaElection[]> {
    const e = await prisma.prismaElection.findMany({
      where: {
        id: {
          in: electionIds.slice(),
        },
      },
    });

    return e;
  }

  /**
   * Returnerar alla nomineringar för posten och valet, men bara
   * poster man kan nomineras till.
   * @param electionId ID på ett val
   * @param postname Namnet på posten
   * @returns Lista över nomineringar
   */
  async getNominations(electionId: number, postname: string): Promise<PrismaNomination[]> {
    const n = await prisma.prismaNomination.findMany({
      where: {
        refElection: electionId,
        refPost: postname,

        // Bara om valet har denna posten som valbar,
        // så att det kan stängas av och på
        election: {
          electables: {
            some: {
              refPost: postname,
            },
          },
        },
      },
    });

    return n;
  }

  /**
   * Returnerar alla nomineringar för valet, om specificerat endast
   * de med ett specifikt svar. Returnerar inte nomineringar som inte
   * finns som electables.
   * @param electionId ID på ett val
   * @param answer Vilken typ av svar som ska returneras. Om `undefined`/`null` ges alla
   * @returns Lista över nomineringar
   */
  async getAllNominations(
    electionId: number,
    answer?: NominationAnswer,
  ): Promise<PrismaNomination[]> {
    // TODO: Finns det ett sätt att göra detta på en query
    // utan raw?
    const aq = Prisma.sql`AND nominations.answer = ${answer}`;

    const n = await prisma.$queryRaw<RawDbNomination[]>`
      SELECT *
      FROM nominations
      LEFT JOIN electables
      USING (ref_election, ref_post)
      WHERE nominations.ref_election = ${electionId}
      ${answer != null ? aq : Prisma.empty}
    `;

    return this.reduceRawDbNominations(n);
  }

  /**
   * Returnerar alla nomineringar för en användare för ett val, om specificerat endast
   * de med ett specifikt svar. Hämtar inte nomineringar som inte finns som electables
   * @param electionId ID på ett val
   * @param username Användarnamnet
   * @param answer Vilken typ av svar som ska returneras. Om `undefined`/`null` ges alla
   * @returns Lista över nomineringar
   */
  async getAllNominationsForUser(
    electionId: number,
    username: string,
    answer?: NominationAnswer,
  ): Promise<PrismaNomination[]> {
    // TODO: Finns det ett sätt att göra detta på en query
    // utan raw?
    const aq = Prisma.sql`AND nominations.answer = ${answer}`;

    const n = await prisma.$queryRaw<RawDbNomination[]>`
      SELECT *
      WHERE nominations.ref_election = ${electionId}
      LEFT JOIN electables
      USING (ref_election, ref_post)
      AND nominations.ref_user = ${username}
      ${answer != null ? aq : Prisma.empty}
    `;

    return this.reduceRawDbNominations(n);
  }

  /**
   * Räknar antalet nomineringar för en post och ett möte. Om posten utelämnas returneras
   * det totala antalet nomineringar. Svaret kan inte specificeras, då det lämnar ut för
   * mycket information. Räknar inte nomineringar som inte finns som electables.
   * @param electionId ID på ett val
   * @param postname Namnet på posten
   * @returns Ett heltal (`number`)
   */
  async getNumberOfNominations(electionId: number, postname?: string): Promise<number> {
    const aq = Prisma.sql`AND nominations.ref_post = ${postname}`;

    const c = await prisma.$queryRaw<number[]>`
      SELECT count(id)
      FROM nominations
      LEFT JOIN electables
      USING (ref_election, ref_post)
      WHERE nominations.ref_election = ${electionId}
      ${postname != null ? aq : Prisma.empty}
    `;

    return c.length === 0 ? 0 : c[0];
  }

  /**
   * Räknar antalet förslag för en post och ett möte. Om posten utelämnas returneras
   * det totala antalet förslag.
   * @param electionId ID på ett val
   * @param postname Namnet på posten
   * @returns Ett heltal (`number`)
   */
  async getNumberOfProposals(electionId: number, postname?: string): Promise<number> {
    const c = prisma.prismaProposal.count({
      where: {
        refElection: electionId,
        refPost: postname,
      },
    });

    return c;
  }

  /**
   * Hittar alla valberedningens nomineringar för ett val.
   * @param electionId ID på ett val
   */
  async getAllProposals(electionId: number): Promise<PrismaProposal[]> {
    const p = await prisma.prismaProposal.findMany({
      where: {
        refElection: electionId,
      },
    });

    return p;
  }

  /**
   * Hittar alla valbara poster (postnamn) för ett val.
   * @param electionId ID på ett val
   * @returns Lista på `postnames`
   */
  async getAllElectables(electionId: number): Promise<string[]> {
    const electableRows = await prisma.prismaElectable.findMany({
      select: {
        refPost: true,
      },
      where: {
        refElection: electionId,
      },
    });

    const refposts = electableRows.map((e) => e.refPost);

    return refposts;
  }

  /**
   * Skapar ett nytt val, förutsatt att det inte finns några öppna val,
   * eller val som inte har ett datum de stängdes.
   * @param creatorUsername Användarnamnet på skaparen av valet
   * @param electables En lista med postnamn
   * @param nominationsHidden Om nomineringar ska vara dolda för alla utom den som blivit nominerad och valadmin
   * @returns `electionId` hos skapade mötet
   */
  async createElection(
    creatorUsername: string,
    electables: string[],
    nominationsHidden: boolean,
  ): Promise<number> {
    // Vi försäkrar oss om att det senaste valet är stängt
    const lastElection = (await this.getLatestElections(1))[0];
    if (lastElection != null && (lastElection?.open || lastElection?.closedAt == null)) {
      throw new BadRequestError(
        'Det finns ett öppet val, eller ett val som väntar på att bli öppnat redan.',
      );
    }

    try {
      const createdElection = await prisma.prismaElection.create({
        data: {
          refCreator: creatorUsername,
          nominationsHidden,

          // Nested create
          electables: {
            createMany: {
              data: electables.map((e) => {
                return {
                  refPost: e,
                };
              }),
            },
          },
        },
      });

      return createdElection.id;
    } catch (err) {
      logger.error(`Error when trying to create new election:\n\t${JSON.stringify(err)}`);
      throw new ServerError('Kunde inte skapa elections eller electables');
    }
  }

  /**
   * Försöker att lägga till alla poster som valbara i det specificerade valet.
   * @param electionId ID på ett val
   * @param postnames Lista på postslugs
   */
  async addElectables(electionId: number, postnames: string[]): Promise<boolean> {
    if (postnames.length === 0) {
      throw new BadRequestError('Inga poster specificerade');
    }

    try {
      await prisma.prismaElectable.createMany({
        data: postnames.map((p) => {
          return {
            refElection: electionId,
            refPost: p,
          };
        }),
      });
    } catch (err) {
      logger.debug(
        `Could not insert electables for election with ID ${electionId} due to error:\n\t${JSON.stringify(
          err,
        )}`,
      );
      throw new ServerError('Kunde inte lägga alla valbara poster');
    }

    return true;
  }

  /**
   * Tar bort alla poster som valbara i det specificerade valet
   * @param electionId ID på ett val
   * @param postnames Lista på postslugs
   */
  async removeElectables(electionId: number, postnames: string[]): Promise<boolean> {
    if (postnames.length === 0) {
      throw new BadRequestError('Inga poster specificerade');
    }

    const { count } = await prisma.prismaElectable.deleteMany({
      where: {
        refElection: electionId,
        refPost: {
          in: postnames,
        },
      },
    });

    if (count !== postnames.length) {
      logger.debug(`Could not delete all electables for election with ID ${electionId}`);
      throw new ServerError('Kunde inte ta bort alla valbara poster');
    }

    return true;
  }

  /**
   * Försöker att lägga till alla poster som valbara i det specificerade valet.
   * @param electionId ID på ett val
   * @param postnames Lista på postslugs
   */
  async setElectables(electionId: number, postnames: string[]): Promise<boolean> {
    if (postnames.length < 1) {
      throw new BadRequestError('Inga valbara poster definierades');
    }
    try {
      // Vi rollbacka om inte hela operationen fungerar
      await prisma.$transaction([
        prisma.prismaElectable.deleteMany({
          where: {
            refElection: {
              in: electionId,
            },
          },
        }),
        prisma.prismaElectable.createMany({
          data: postnames.map((p) => {
            return {
              refElection: electionId,
              refPost: p,
            };
          }),
        }),
      ]);
    } catch (err) {
      logger.debug(
        `Could not insert electables for election with ID ${electionId} due to error:\n\t${JSON.stringify(
          err,
        )}`,
      );
      throw new ServerError('Kunde inte sätta alla valbara poster, ingen operation utfördes');
    }

    return true;
  }

  /**
   * Ändrar om nomineringar är dolda eller ej för ett val.
   * @param electionId ID på ett val
   * @param hidden Om alla ska kunna vem som tackat ja till vad eller ej
   * @returns Om en ändring gjordes eller ej
   */
  async setHiddenNominations(electionId: number, hidden: boolean): Promise<boolean> {
    try {
      await prisma.prismaElection.update({
        data: {
          nominationsHidden: hidden,
        },
        where: {
          id: electionId,
        },
      });

      return true;
    } catch {
      throw new BadRequestError('Kunde inte uppdatera nomineringssynligheten');
    }
  }

  /**
   * Öppnar ett val, förutsatt att det inte redan stängts en gång
   * @param electionId ID på ett val
   */
  async openElection(electionId: number): Promise<boolean> {
    try {
      // Markerar valet som öppet, men bara om det inte redan stängts
      // måste använda updateMany för att kunna söka på `openedAt`
      await prisma.prismaElection.updateMany({
        data: {
          openedAt: new Date(),
          open: true,
        },
        where: {
          id: electionId,
          openedAt: null,
          open: false,
        },
      });

      return true;
    } catch {
      throw new BadRequestError(
        'Antingen är valet redan öppet eller stängt, eller så finns det inte.',
      );
    }
  }

  /**
   * Stänger alla öppna val, men ger ett fel om fler än ett måste stängas,
   * då endast ett ska kunna vara öppet samtidigt.
   */
  async closeElection(): Promise<boolean> {
    try {
      const { count } = await prisma.prismaElection.updateMany({
        data: {
          closedAt: new Date(),
          open: false,
        },
        where: {
          open: true,
        },
      });

      if (count < 1) {
        throw new BadRequestError('Antingen är valet redan stängt, eller så finns det inte.');
      } else if (count > 1) {
        logger.warn(
          'VARNING: Anrop till closeElection stängde mer än ett val! Endast ett val ska kunna vara öppet samtidigt!',
        );
        throw new ServerError(
          'Mer än ett val stängdes, men fler än ett val ska inte kunna vara öppna samtidigt!',
        );
      }

      return true;
    } catch {
      throw new ServerError('Något gick fel då valet skulle stängas!');
    }
  }

  /**
   * Försöker hitta ett öppet val och om det finns, nominerar
   * användaren till alla poster om de finns som electables.
   * @param username Användarnamn på den som ska nomineras
   * @param postnames Namnet på alla poster personen ska nomineras till
   */
  async nominate(username: string, postnames: string[]): Promise<boolean> {
    if (postnames.length === 0) {
      throw new BadRequestError('Inga postslugs specificerade');
    }

    const openElection = await this.getOpenElection();

    // Nomineringar måste finnas som electables
    const electables = await this.getAllElectables(openElection.id);
    const filteredPostnames = postnames.filter((e) => electables.includes(e));

    if (filteredPostnames.length === 0) {
      throw new BadRequestError('Ingen av de angivna posterna är valbara i detta val');
    }

    try {
      // Om nomineringen redan finns, ignorera den
      // utan att ge error för att inte avslöja
      // vad som finns i databasen redan
      await prisma.prismaNomination.createMany({
        skipDuplicates: true, // Ignorera om nomineringen redan finns
        data: filteredPostnames.map((postname) => {
          return {
            refElection: openElection.id,
            refUser: username,
            refPost: postname,
            answer: PrismaNominationAnswer.NO_ANSWER,
          };
        }),
      });

      return true;
    } catch (err) {
      logger.debug(
        `Could not insert all nominations for election with ID ${
          openElection.id
        } due to error:\n\t${JSON.stringify(err)}`,
      );
      throw new ServerError('Kunde inte nominera till alla poster');
    }
  }

  async respondToNomination(
    username: string,
    postname: string,
    answer: NominationAnswer,
  ): Promise<boolean> {
    const openElection = await this.getOpenElection();

    try {
      await prisma.prismaNomination.update({
        data: {
          answer,
        },
        where: {
          // Dessa tre är unik
          refElection_refPost_refUser: {
            refElection: openElection.id,
            refUser: username,
            refPost: postname,
          },
        },
      });

      return true;
    } catch {
      throw new NotFoundError('Kunde inte hitta nomineringen!');
    }
  }

  /**
   * Lägger till ett förslag från valberedningen för en post. Kontrollerar
   * inte att det finns lika många platser (`Post.spots`) som förslag,
   * då det minskar prestanda, och valberedningen kan välja att
   * överföreslå. Kontrollerar inte heller om posten är valbar;
   * det får valberedningen lösa!
   * @param electionId ID på ett val
   * @param username Användarnamn på den som ska föreslås
   * @param postname Posten användaren ska föreslås på
   */
  async propose(electionId: number, username: string, postname: string): Promise<boolean> {
    try {
      await prisma.prismaProposal.create({
        data: {
          refElection: electionId,
          refUser: username,
          refPost: postname,
        },
      });

      return true;
    } catch (err) {
      logger.error(
        `Could not insert proposal for user ${username} and post ${postname} in election with ID ${electionId} due to error:\n\t${JSON.stringify(
          err,
        )}`,
      );
      throw new ServerError(`Kunde inte föreslå användaren ${username} till posten ${postname}`);
    }
  }

  /**
   * Försöker ta bort en av valberedningens förslag till en post.
   * @param electionId ID på valet
   * @param username Användarnamn på föreslagen person
   * @param postname Namnet på posten personen föreslagits till
   * @throws `ServerError` om förslaget inte kunde tas bort (eller det aldrig fanns)
   */
  async removeProposal(electionId: number, username: string, postname: string): Promise<boolean> {
    try {
      await prisma.prismaProposal.delete({
        where: {
          refElection_refPost_refUser: {
            refElection: electionId,
            refUser: username,
            refPost: postname,
          }
        }
      });

      return true;
    } catch {
      logger.error(
        `Could not delete proposal for user ${username} and post ${postname} in election with ID ${electionId}}`,
      );
      throw new ServerError(
        `Kunde inte ta bort föreslaget för användaren ${username} till posten ${postname}, vilket kan bero på att föreslaget inte fanns`,
      );
    }
  }
}
