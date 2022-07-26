/* eslint-disable @typescript-eslint/indent */
import { BadRequestError, NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { devGuard } from '@/util';
import { NominationAnswer } from '@generated/graphql';
import {
  PrismaElection,
  PrismaNomination,
  PrismaNominationAnswer,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return e;
  }

  /**
   * Returnerar alla nomineringar för posten och valet, men bara
   * poster man kan nomineras till.
   * @param electionId ID på ett val
   * @param postId ID på en post
   * @returns Lista över nomineringar
   */
  async getNominations(electionId: number, postId: number): Promise<PrismaNomination[]> {
    const n = await prisma.prismaNomination.findMany({
      where: {
        refElection: electionId,
        refPost: postId,

        // Bara om valet har denna posten som valbar,
        // så att det kan stängas av och på
        election: {
          electables: {
            some: {
              refPost: postId,
            },
          },
        },
      },
      orderBy: {
        post: {
          postname: 'asc',
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
    // We want to make sure that we join these queries together as if they were one
    // This is possible to do with a simple join in SQL, but I haven't found
    // a way to do it in prisma, and this is nicer than $queryRaw for reliability
    const [nominations, electables] = await prisma.$transaction([
      prisma.prismaNomination.findMany({
        where: {
          refElection: electionId,
          answer,
        },
        orderBy: {
          post: {
            postname: 'asc',
          },
        },
      }),
      prisma.prismaElectable.findMany({
        select: {
          refPost: true,
        },
        where: {
          refElection: electionId,
        },
        orderBy: {
          post: {
            postname: 'asc',
          },
        },
      }),
    ]);

    // Use set in hope that it is faster than O(n^2)
    const electablePostIds = new Set(electables.map((e) => e.refPost));

    // We only want to return nominations that are electable
    return nominations.filter((n) => electablePostIds.has(n.refPost));
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
    // Explanatory comments in `getAllNominations`
    const [nominations, electables] = await prisma.$transaction([
      prisma.prismaNomination.findMany({
        where: {
          refElection: electionId,
          refUser: username,
          answer,
        },
        orderBy: {
          post: {
            postname: 'asc',
          },
        },
      }),
      prisma.prismaElectable.findMany({
        select: {
          refPost: true,
        },
        where: {
          refElection: electionId,
        },
        orderBy: {
          post: {
            postname: 'asc',
          },
        },
      }),
    ]);

    // Use set in hope that it is faster than O(n^2)
    const electablePostIds = new Set(electables.map((e) => e.refPost));

    // We only want to return nominations that are electable
    return nominations.filter((n) => electablePostIds.has(n.refPost));
  }

  /**
   * Räknar antalet nomineringar för en post och ett möte. Om posten utelämnas returneras
   * det totala antalet nomineringar. Svaret kan inte specificeras, då det lämnar ut för
   * mycket information. Räknar inte nomineringar som inte finns som electables.
   * @param electionId ID på ett val
   * @param postId ID på en post
   * @returns Ett heltal (`number`)
   */
  async getNumberOfNominations(electionId: number, postId?: number): Promise<number> {
    // Explanatory comments in `getAllNominations`
    const [nominations, electables] = await prisma.$transaction([
      prisma.prismaNomination.findMany({
        select: {
          refPost: true,
        },
        where: {
          refElection: electionId,
          refPost: postId,
        },
      }),
      prisma.prismaElectable.findMany({
        select: {
          refPost: true,
        },
        where: {
          refElection: electionId,
        },
      }),
    ]);

    // Use set in hope that it is faster than O(n^2)
    const electablePostIds = new Set(electables.map((e) => e.refPost));

    // We only want to count nominations that are electable
    const filteredNominations = nominations.filter((n) => electablePostIds.has(n.refPost));

    return filteredNominations.length;
  }

  /**
   * Räknar antalet förslag för en post och ett möte. Om posten utelämnas returneras
   * det totala antalet förslag.
   * @param electionId ID på ett val
   * @param postId ID på en post
   * @returns Ett heltal (`number`)
   */
  async getNumberOfProposals(electionId: number, postId?: number): Promise<number> {
    const c = prisma.prismaProposal.count({
      where: {
        refElection: electionId,
        refPost: postId,
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
      orderBy: {
        post: {
          postname: 'asc',
        },
      },
    });

    return p;
  }

  /**
   * Hittar alla valbara poster (postnamn) för ett val.
   * @param electionId ID på ett val
   * @returns Lista på `posts.id`
   */
  async getAllElectables(electionId: number): Promise<number[]> {
    const electableRows = await prisma.prismaElectable.findMany({
      select: {
        refPost: true,
      },
      where: {
        refElection: electionId,
      },
      orderBy: {
        post: {
          postname: 'asc',
        },
      },
    });

    const refPosts = electableRows.map((e) => e.refPost);

    return refPosts;
  }

  /**
   * Skapar ett nytt val, förutsatt att det inte finns några öppna val,
   * eller val som inte har ett datum de stängdes.
   * @param creatorUsername Användarnamnet på skaparen av valet
   * @param electables En lista med post-ID:n
   * @param nominationsHidden Om nomineringar ska vara dolda för alla utom den som blivit nominerad och valadmin
   * @returns `electionId` hos skapade mötet
   */
  async createElection(
    creatorUsername: string,
    electables: number[],
    nominationsHidden: boolean,
  ): Promise<PrismaElection> {
    return prisma.$transaction(async (p) => {
      // Vi försäkrar oss om att det senaste valet är stängt
      const lastElection = (await this.getLatestElections(1))[0];
      if (lastElection != null && (lastElection?.open || lastElection?.closedAt == null)) {
        throw new BadRequestError(
          'Det finns ett öppet val, eller ett val som väntar på att bli öppnat redan.',
        );
      }

      try {
        const createdElection = await p.prismaElection.create({
          data: {
            refCreator: creatorUsername,
            nominationsHidden,

            // Nested create
            electables: {
              createMany: {
                data: electables.map((e) => ({
                  refPost: e,
                })),
              },
            },
          },
        });

        return createdElection;
      } catch (err) {
        logger.error(`Error when trying to create new election:\n\t${JSON.stringify(err)}`);
        throw new ServerError('Kunde inte skapa elections eller electables');
      }
    });
  }

  /**
   * Försöker att lägga till alla poster som valbara i det specificerade valet.
   * @param electionId ID på ett val
   * @param postIds Lista på post-ID:n
   */
  async addElectables(electionId: number, postIds: number[]): Promise<boolean> {
    if (postIds.length === 0) {
      throw new BadRequestError('Inga poster specificerade');
    }

    try {
      await prisma.prismaElectable.createMany({
        data: postIds.map((p) => {
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
   * @param postIds Lista på post-ID:n
   */
  async removeElectables(electionId: number, postIds: number[]): Promise<boolean> {
    if (postIds.length === 0) {
      throw new BadRequestError('Inga poster specificerade');
    }

    const { count } = await prisma.prismaElectable.deleteMany({
      where: {
        refElection: electionId,
        refPost: {
          in: postIds,
        },
      },
    });

    if (count !== postIds.length) {
      logger.debug(`Could not delete all electables for election with ID ${electionId}`);
      throw new ServerError('Kunde inte ta bort alla valbara poster');
    }

    return true;
  }

  /**
   * Försöker att lägga till alla poster som valbara i det specificerade valet.
   * @param electionId ID på ett val
   * @param postIds Lista på post-ID:n
   */
  async setElectables(electionId: number, postIds: number[]): Promise<boolean> {
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
          data: postIds.map((p) => {
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
    // Markerar valet som öppet, men bara om det inte redan stängts
    // måste använda updateMany för att kunna söka på `openedAt`
    const { count } = await prisma.prismaElection.updateMany({
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

    if (count < 1) {
      throw new BadRequestError(
        'Antingen är valet redan öppet eller stängt, eller så finns det inte.',
      );
    }

    if (count > 1) {
      // Detta ska i princip aldrig kunna hända då alla val har unika ID:n
      throw new ServerError('Mer än ett val öppnades, vilket inte ska kunna hända!');
    }

    return true;
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
   * @param postIds ID:t på alla poster personen ska nomineras till
   */
  async nominate(username: string, postIds: number[]): Promise<boolean> {
    if (postIds.length === 0) {
      throw new BadRequestError('Inga postslugs specificerade');
    }

    const openElection = await this.getOpenElection();

    // Nomineringar måste finnas som electables
    const electables = await this.getAllElectables(openElection.id);
    const filteredPostIds = postIds.filter((e) => electables.includes(e));

    if (filteredPostIds.length === 0) {
      throw new BadRequestError('Ingen av de angivna posterna är valbara i detta val');
    }

    try {
      // Om nomineringen redan finns, ignorera den
      // utan att ge error för att inte avslöja
      // vad som finns i databasen redan
      await prisma.prismaNomination.createMany({
        skipDuplicates: true, // Ignorera om nomineringen redan finns
        data: filteredPostIds.map((postId) => {
          return {
            refElection: openElection.id,
            refUser: username,
            refPost: postId,
            answer: PrismaNominationAnswer.NOT_ANSWERED,
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
    postId: number,
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
            refPost: postId,
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
   * @param postId Posten användaren ska föreslås på
   */
  async propose(electionId: number, username: string, postId: number): Promise<boolean> {
    try {
      await prisma.prismaProposal.create({
        data: {
          refElection: electionId,
          refUser: username,
          refPost: postId,
        },
      });

      return true;
    } catch (err) {
      logger.error(
        `Could not insert proposal for user ${username} and post ID ${postId} in election with ID ${electionId} due to error:\n\t${JSON.stringify(
          err,
        )}`,
      );
      throw new ServerError(`Kunde inte föreslå användaren ${username} till posten ID ${postId}`);
    }
  }

  /**
   * Försöker ta bort en av valberedningens förslag till en post.
   * @param electionId ID på valet
   * @param username Användarnamn på föreslagen person
   * @param postId ID på posten personen föreslagits till
   * @throws `ServerError` om förslaget inte kunde tas bort (eller det aldrig fanns)
   */
  async removeProposal(electionId: number, username: string, postId: number): Promise<boolean> {
    try {
      await prisma.prismaProposal.delete({
        where: {
          refElection_refPost_refUser: {
            refElection: electionId,
            refUser: username,
            refPost: postId,
          },
        },
      });

      return true;
    } catch {
      logger.error(
        `Could not delete proposal for user ${username} and post ID ${postId} in election with ID ${electionId}}`,
      );
      throw new ServerError(
        `Kunde inte ta bort föreslaget för användaren ${username} till posten med ID ${postId}, vilket kan bero på att föreslaget inte fanns`,
      );
    }
  }

  /**
   * Clear all data related to elections from the database
   */
  async clear() {
    devGuard('Cannot clear DB in production');

    await prisma.prismaElectable.deleteMany();
    await prisma.prismaProposal.deleteMany();
    await prisma.prismaNomination.deleteMany();
    await prisma.prismaElection.deleteMany();
  }
}
