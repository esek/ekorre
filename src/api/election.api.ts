/* eslint-disable @typescript-eslint/indent */
import { BadRequestError, NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { NominationResponse } from '@generated/graphql';
import {
  Prisma,
  PrismaElectable,
  PrismaElection,
  PrismaNomination,
  PrismaNominationResponse,
  PrismaProposal,
} from '@prisma/client';

import prisma from './prisma';

const logger = Logger.getLogger('ElectionAPI');

export class ElectionAPI {
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
   * @param response Vilken typ av svar som ska returneras. Om `undefined`/`null` ges alla
   * @returns Lista över nomineringar
   */
  async getAllNominations(
    electionId: number,
    response?: NominationResponse,
  ): Promise<PrismaNomination[]> {
    // TODO: Finns det ett sätt att göra detta på en query
    // utan raw?
    const aq = Prisma.sql`AND nominations.response = ${response}`;

    const n = await prisma.$queryRaw<PrismaNomination[]>`
      SELECT * FROM nominations
      FROM nominations
      WHERE nominations.ref_election = ${electionId}
      ${response != null ? aq : Prisma.empty}
      LEFT JOIN electables
      ON (
        electables.ref_election = nominations.ref_election,
        AND electables.ref_post = nominations.ref_post
      ) 
    `;

    return n;
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
    response?: NominationResponse,
  ): Promise<PrismaNomination[]> {
    // TODO: Finns det ett sätt att göra detta på en query
    // utan raw?
    const aq = Prisma.sql`AND nominations.response = ${response}`;

    const n = await prisma.$queryRaw<PrismaNomination[]>`
      SELECT * FROM nominations
      FROM nominations
      WHERE nominations.ref_election = ${electionId}
      AND nominations.ref_user = ${username}
      ${response != null ? aq : Prisma.empty}
      LEFT JOIN electables
      ON (
        electables.ref_election = nominations.ref_election,
        AND electables.ref_post = nominations.ref_post
      )
    `;

    return n;
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
      WHERE nominations.ref_election = ${electionId}
      ${postname != null ? aq : Prisma.empty}
      LEFT JOIN electables
      ON (
        electables.ref_election = nominations.ref_election,
        AND electables.ref_post = nominations.ref_post
      )
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
   * @param postnames Lista på postnamn
   */
  async addElectables(electionId: number, postnames: string[]): Promise<boolean> {
    if (postnames.length === 0) {
      throw new BadRequestError('Inga postnamn specificerade');
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
   * @param postnames Lista på postnamn
   */
  async removeElectables(electionId: number, postnames: string[]): Promise<boolean> {
    if (postnames.length === 0) {
      throw new BadRequestError('Inga postnamn specificerade');
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
   * @param postnames Lista på postnamn
   */
  async setElectables(electionId: number, postnames: string[]): Promise<boolean> {
    const q = db<DatabaseElectable>(ELECTABLE_TABLE);

    try {
      // Remove existing electables
      await q.where({ refelection: electionId }).delete();

      if (postnames.length > 0) {
        const electableRows: DatabaseElectable[] = postnames.map((postname) => {
          return { refelection: electionId, refpost: postname };
        });

        await db(ELECTABLE_TABLE).insert(electableRows);
      }
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
   * Ändrar om nomineringar är dolda eller ej för ett val.
   * @param electionId ID på ett val
   * @param hidden Om alla ska kunna vem som tackat ja till vad eller ej
   * @returns Om en ändring gjordes eller ej
   */
  async setHiddenNominations(electionId: number, hidden: boolean): Promise<boolean> {
    const res = await db<DatabaseElection>(ELECTION_TABLE)
      .update('nominationsHidden', hidden)
      .where('id', electionId);
    return res > 0;
  }

  /**
   * Öppnar ett val, förutsatt att det inte redan stängts en gång
   * @param electionId ID på ett val
   */
  async openElection(electionId: number): Promise<boolean> {
    // Markerar valet som öppet, men bara om det inte redan stängts
    const res = await db<DatabaseElection>(ELECTION_TABLE)
      .update({
        openedAt: Date.now(), // Current timestamp
        open: true,
      })
      .where({
        id: electionId,
        openedAt: null, // Annars återställer vi ju timestamp om vi öppnar redan öppet val
        open: false,
      })
      .whereNull('closedAt');

    if (res === 0) {
      throw new BadRequestError(
        'Antingen är valet redan öppet eller stängt, eller så finns det inte.',
      );
    }

    return true;
  }

  /**
   * Stänger alla öppna val, men ger ett fel om fler än ett måste stängas,
   * då endast ett ska kunna vara öppet samtidigt.
   */
  async closeElection(): Promise<boolean> {
    const res = await db<DatabaseElection>(ELECTION_TABLE)
      .update({
        closedAt: Date.now(),
        open: false,
      })
      .where({ open: true });

    if (res > 1) {
      logger.warn(
        'VARNING: Anrop till closeElection stängde mer än ett val! Endast ett val ska kunna vara öppet samtidigt!',
      );
      throw new ServerError(
        'Mer än ett val stängdes, men fler än ett val ska inte kunna vara öppna samtidigt!',
      );
    }

    if (res === 0) {
      throw new BadRequestError('Antingen är valet redan stängt, eller så finns det inte.');
    }

    return true;
  }

  /**
   * Försöker hitta ett öppet val och om det finns, nominerar
   * användaren till alla poster om de finns som electables.
   * @param username Användarnamn på den som ska nomineras
   * @param postnames Namnet på alla poster personen ska nomineras till
   */
  async nominate(username: string, postnames: string[]): Promise<boolean> {
    if (postnames.length === 0) {
      throw new BadRequestError('Inga postnamn specificerade');
    }

    const openElection = await this.getOpenElection();

    // Nomineringar måste finnas som electables
    const electables = await this.getAllElectables(openElection.id);
    const filteredPostnames = postnames.filter((e) => electables.includes(e));

    if (filteredPostnames.length === 0) {
      throw new BadRequestError('Ingen av de angivna posterna är valbara i detta val');
    }

    const nominationRows: DatabaseNomination[] = filteredPostnames.map((postname) => ({
      refelection: openElection.id,
      refuser: username,
      refpost: postname,
      accepted: NominationResponse.NoAnswer,
    }));

    try {
      // Om nomineringen redan finns, ignorera den
      // utan att ge error för att inte avslöja
      // vad som finns i databasen redan
      await db<DatabaseNomination>(NOMINATION_TABLE)
        .insert(nominationRows)
        .onConflict(['refelection', 'refuser', 'refpost'])
        .ignore();
    } catch (err) {
      logger.debug(
        `Could not insert all nominations for election with ID ${
          openElection.id
        } due to error:\n\t${JSON.stringify(err)}`,
      );
      throw new ServerError('Kunde inte nominera till alla poster');
    }

    return true;
  }

  async respondToNomination(
    username: string,
    postname: string,
    accepts: NominationResponse,
  ): Promise<boolean> {
    const openElection = await this.getOpenElection();
    const res = await db<DatabaseNomination>(NOMINATION_TABLE).update('accepted', accepts).where({
      refelection: openElection.id,
      refuser: username,
      refpost: postname,
    });

    if (res === 0) {
      throw new NotFoundError('Kunde inte hitta nomineringen, eller så är valet stängt!');
    }

    return true;
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
      await db<DatabaseProposal>(PROPOSAL_TABLE).insert({
        refelection: electionId,
        refuser: username,
        refpost: postname,
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
    const res = await db<DatabaseProposal>(PROPOSAL_TABLE).delete().where({
      refelection: electionId,
      refuser: username,
      refpost: postname,
    });

    if (res === 0) {
      logger.error(
        `Could not delete proposal for user ${username} and post ${postname} in election with ID ${electionId}}`,
      );
      throw new ServerError(
        `Kunde inte ta bort föreslaget för användaren ${username} till posten ${postname}, vilket kan bero på att föreslaget inte fanns`,
      );
    }

    return true;
  }
}
