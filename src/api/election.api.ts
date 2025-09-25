/* eslint-disable @typescript-eslint/indent */
import { BadRequestError, NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { devGuard } from '@/util';
import { NominationAnswer } from '@generated/graphql';
import {
  Prisma,
  PrismaElection,
  PrismaNomination,
  PrismaNominationAnswer,
  PrismaProposal,
} from '@prisma/client';

import prisma from './prisma';

const logger = Logger.getLogger('ElectionAPI');

export class ElectionAPI {
  /**
   * Retrieves elections ordered by creation date
   * @param limit Number of elections to be returned; `null` means all meetings
   * @param includeUnopened If unopened elections should be included
   * @param includeHiddenNominations If elections with hidden nominations should be included
   */
  async getLatestElections(
    limit?: number,
    includeUnopened = true,
    includeHiddenNominations = true,
  ): Promise<PrismaElection[]> {
    const unopenedWhere: Prisma.PrismaElectionWhereInput = {};

    if (!includeUnopened) {
      // Either it has been opened and is then closed, or it is currently open
      unopenedWhere.OR = [
        {
          // It is currently opened
          open: true,
        },
        {
          // It has been opened before, and is now closed
          NOT: {
            closedAt: null,
          },
        },
      ];
    }

    const e = await prisma.prismaElection.findMany({
      where: {
        ...unopenedWhere,
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
   * Retrieves the latest meeting marked as `open`
   * @throws `NotFoundError`
   */
  async getOpenElections(): Promise<PrismaElection[]> {
    const e = await prisma.prismaElection.findMany({
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
   * Retrieves a list of all elections that match any of the provided IDs,
   * ordered by creation date (newest first)
   * @param electionIds A list of `electionId`
   * @returns A list of elections
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
   * Retrieves all nominations for a post in the specified election,
   * but only posts that a user can be elected to currently. Sorted
   * by postnames
   * @param electionId ID of an election
   * @param postId ID of a post
   * @returns List of nominations
   */
  async getNominations(electionId: number, postId: number): Promise<PrismaNomination[]> {
    const n = await prisma.prismaNomination.findMany({
      where: {
        refElection: electionId,
        refPost: postId,

        // Only of the election has this post marked as up for election currently,
        // so it can be turned on and off
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
   * Retrieves all nominations for an election, and if specified, only
   * those with a specific answer. Does *not* return nominations not marked as electable.
   * Response is ordered by postname
   * @param electionId ID of an election
   * @param answer What kind of answers are to be returned. If `null`, all answers are returned
   * @returns List of nominations
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
          // We only need postId, don't read anything else
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
   * Retrieves all nominations for a user for an election, and if specified, only
   * those with a specific answer. Does *not* return nominations not marked as electable.
   * Response is ordered by postname
   * @param electionId ID of an election
   * @param username Username for the user
   * @param answer What kind of answers are to be returned. If `null`, all answers are returned
   * @returns List of nominations
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
   * Counts the total number of nominations for a post for an election.
   * If the post is left out, the total number of nominations of the election is returned.
   *
   * The answer cannot be specified, as it would provide too much information if the election
   * is set to have hidden nominations.
   *
   * **Note:** Does *not* count nominations for posts not currently marked as electable
   * @param electionId ID of an election
   * @param postId ID of a post
   * @returns An integer
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
   * Counts the total number of proposals for a post for an election. If the post ID is left
   * out, the total number of proposals are returned instead
   * @param electionId ID of an election
   * @param postId ID of a post
   * @returns An integer
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
   * Retrieves all of Valberedningens proposals for an election ordered by postname
   * @param electionId ID of an election
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
   * Finds all electable posts (postIds) for an election, ordered by postname (not returned)
   * @param electionId ID of an election
   * @returns List of `posts.id`
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
   * Creates a new election, on two conditions:
   *  0. No election is currently marked as open
   *  1. No election is currenly has an end date marked as `null`
   * @param creatorUsername Username of the user who created the election
   * @param electables A list of post IDs to be marked as electable
   * @param nominationsHidden If nominations should be hidden to everyone except the person nominated and election admins
   * @returns The created election
   */
  async createElection(
    creatorUsername: string,
    electables: number[],
    nominationsHidden: boolean,
  ): Promise<PrismaElection> {
    return prisma.$transaction(async (p) => {
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
   * Attempts to add all posts provided as electable in the specified election
   * @param electionId ID of an election
   * @param postIds List of post IDs
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
   * Removes all posts specified as electable in the specified election
   * @param electionId ID of an election
   * @param postIds List of post IDs
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
   * Adds all posts specified as electable in the specified election
   * @param electionId ID of an election
   * @param postIds List of post IDs
   */
  async setElectables(electionId: number, postIds: number[]): Promise<boolean> {
    try {
      // We will rollback if the whole operation did succeed
      await prisma.$transaction([
        prisma.prismaElectable.deleteMany({
          where: {
            refElection: {
              in: [electionId],
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
   * Changes if nominations are to be hidden or not for an election
   * @param electionId ID of an election
   * @param hidden If all users should be able to see who accepted nominations or not
   * @returns If a change was made or not
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
   * Opens an election, provided that is has not already been closed once
   * @param electionId ID of an election
   * @returns If the election was opened
   */
  async openElection(electionId: number): Promise<boolean> {
    // Must use `updateMany` to be able to search for `openedAt`
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
   * Closes *all* open elections, but throws an error if more than one election had to
   * be closed, as only one should have been able to be opened in the first place
   * @returns If the elction could be closed without error
   * @throws {ServerError} if more than one election was closed, or something else unexpected happened
   */
  async closeElection(electionId: number): Promise<boolean> {
    try {
      const { count } = await prisma.prismaElection.updateMany({
        data: {
          closedAt: new Date(),
          open: false,
        },
        where: {
          id: electionId,
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
   * Attempts to find an open election, and if it exists, nominates the user
   * to all posts provided, if they are marked as electable at the time of nomination
   * @param username Username of the user to be nominated
   * @param postIds ID for all posts the person is to be elected to
   * @returns If the person could be elected for any post provided
   */
  async nominate(username: string, postIds: number[]): Promise<boolean> {
    if (postIds.length === 0) {
      throw new BadRequestError('Inga postslugs specificerade');
    }

    // We want an atomic operation to protect us from race conditions
    await prisma.$transaction(async () => {
      // We want to minimize time blocked by this transaction, so we use
      // a special query
      const openElectionsRes = await prisma.prismaElection.findMany({
        where: {
          open: true,
          electables: {
            some: {
              refPost: { in: postIds },
            },
          },
        },
        select: {
          id: true,
          electables: {
            select: {
              refPost: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (openElectionsRes.length === 0) {
        throw new BadRequestError('Det finns inget öppet val med den angivna posten');
      }

      for (const openElectionRes of openElectionsRes) {
        const electablePostIds = openElectionRes.electables.map((e) => e.refPost);

        const filteredPostIds = postIds.filter((e) => electablePostIds.includes(e));

        try {
          // If nominations already exists, ignore them without throwing
          // errors to not reveal possibly hidden nominations
          await prisma.prismaNomination.createMany({
            skipDuplicates: true, // Ignore on collision
            data: filteredPostIds.map((postId) => {
              return {
                refElection: openElectionRes.id,
                refUser: username,
                refPost: postId,
                answer: PrismaNominationAnswer.NOT_ANSWERED,
              };
            }),
          });
        } catch (err) {
          logger.debug(
            `Could not insert all nominations for election with ID ${
              openElectionRes.id
            } due to error:\n\t${JSON.stringify(err)}`,
          );
          throw new ServerError('Kunde inte nominera till alla poster');
        }
      }
    });

    return true;
  }

  async respondToNomination(
    username: string,
    postId: number,
    answer: NominationAnswer,
  ): Promise<boolean> {
    const openElections = await this.getOpenElections();

    let updated = false;

    for (const openElection of openElections) {
      const updatedEntries = await prisma.prismaNomination.updateMany({
        data: { answer },
        where: {
          refElection: openElection.id,
          refUser: username,
          refPost: postId,
        },
      });
      if (updatedEntries.count != 0) updated = true;
    }

    if (updated) {
      return true;
    }

    throw new NotFoundError('Kunde inte hitta nomineringen!');
  }

  /**
   * Adds a proposals from Valberedningen for a post. Does *not* check that there are not
   * more proposals than `Post.spots`, since Valberedningen can do whatever they want.
   * Also does not ensure that the post is electable
   * @param electionId ID of an election
   * @param username Username for the user to be proposed for this post
   * @param postId ID of the post this user is to be proposed for
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
   * Attempts to remove one of Valberedningen's proposals for a post
   * @param electionId ID of the election
   * @param username Username of the previously proposed user
   * @param postId ID of the post the user has previously been proposed for
   * @returns If the proposal could be removed
   * @throws `ServerError` if the proposal could not be removed, or never existed
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
