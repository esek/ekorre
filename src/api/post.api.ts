/* eslint-disable class-methods-use-this */
import { BadRequestError, NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { StrictObject } from '@/models/base';
import { midnightTimestamp, stripObject } from '@/util';
import { Maybe, ModifyPost, NewPost, PostType, Utskott } from '@generated/graphql';
import { PrismaPost, Prisma, PrismaPostHistory } from '@prisma/client';

import prisma from './prisma';

const logger = Logger.getLogger('PostAPI');

/**
 * Kontrollerar att posttyp och antalet platser som
 * definierades är kompatibla. Om de är det, eller ett
 * defaultvärde kan sättas, returneras detta. Annars
 * returneras null
 *
 * @param postType
 * @param spots
 */
const checkPostTypeAndSpots = (
  postType: Maybe<PostType>,
  spots: Maybe<number> | undefined,
): number | null => {
  let s: number | null;
  if (postType === PostType.U) {
    s = 1;
  } else if (postType === PostType.Ea) {
    s = -1;
  } else if (postType === PostType.N || postType === PostType.ExactN) {
    // Om posten ska ha n möjliga platser måste spots ha
    // definierats
    if (spots !== undefined && spots !== null && spots >= 0) {
      s = spots;
    } else {
      s = null;
    }
  } else {
    s = null;
  }
  return s;
};

/**
 * Det här är apin för att hantera poster.
 */
export class PostAPI {
  /**
   * Hämta alla poster.
   * @param limit Begränsning av antal poster
   * @param includeInactive Om inaktiva poster ska inkluderas
   */
  async getPosts(limit?: number, includeInactive = true): Promise<PrismaPost[]> {
    const where: Prisma.PrismaPostWhereInput = {};

    if (!includeInactive) {
      where.active = true;
    }

    const posts = await prisma.prismaPost.findMany({
      where,
      take: limit,
    });

    return posts;
  }

  async getPost(id: number): Promise<PrismaPost> {
    const post = await prisma.prismaPost.findFirst({
      where: {
        id,
      },
    });

    if (!post) {
      throw new NotFoundError('Posten kunde inte hittas');
    }

    return post;
  }

  /**
   * Returnerar ett antal poster.
   * @param postnames Lista på postnamn
   * @param includeInactive Om inaktiva poster ska inkluderas
   */
  async getMultiplePosts(ids: number[], includeInactive = true): Promise<PrismaPost[]> {
    const where: Prisma.PrismaPostWhereInput = {
      id: {
        in: ids,
      },
    };

    if (!includeInactive) {
      where.active = true;
    }

    const posts = await prisma.prismaPost.findMany({
      where,
    });

    return posts;
  }

  /**
   * Hämta alla poster som en användare sitter på, eller har suttit på.
   * @param username användaren
   * @param includeInactive Om inaktiva poster ska inkluderas
   */
  async getPostsForUser(username: string, includeInactive = true): Promise<PrismaPost[]> {
    const where: Prisma.PrismaPostWhereInput = {};

    if (!includeInactive) {
      where.active = true;
    }

    const posts = await prisma.prismaPost.findMany({
      where: {
        ...where,
        history: {
          some: {
            OR: [
              { end: null },
              {
                end: {
                  gt: new Date(),
                },
              },
            ],
            AND: {
              refUser: username,
            },
          },
        },
      },
    });

    return posts;
  }

  /**
   * Hämta alla poster som tillhör ett utskott.
   * @param utskott utskottet
   * @param includeInactive Om inaktiva poster ska inkluderas
   */
  async getPostsFromUtskott(utskott: Utskott, includeInactive = true): Promise<PrismaPost[]> {
    const where: Prisma.PrismaPostWhereInput = {
      utskott,
    };

    if (!includeInactive) {
      where.active = true;
    }

    const posts = await prisma.prismaPost.findMany({
      where,
    });

    return posts;
  }

  async addUsersToPost(
    usernames: string[],
    id: number,
    start?: Date,
    end?: Date,
  ): Promise<boolean> {
    // Ta bort dubbletter
    const uniqueUsernames = [...new Set(usernames)];

    // spots sätter egentligen inte en limit, det
    // är mer informativt och kan ignoreras
    const insert = uniqueUsernames.map<Omit<PrismaPostHistory, 'id'>>((refUser) => ({
      refUser,
      refPost: id,

      // Vi sparar som timestamp i DB
      // Start ska alltid vara 00:00, end alltid 23:59
      start: new Date(midnightTimestamp(start != null ? start : new Date(), 'after')),
      end: end != null ? new Date(midnightTimestamp(end, 'before')) : null,
    }));

    if (!insert.length) {
      logger.info('Empty insert array at addUsersToPost');
      throw new ServerError('Användaren kunde inte läggas till');
    }

    // const res = await db<DatabasePostHistory>(POSTS_HISTORY_TABLE).insert(insert);
    const posts = await prisma.prismaPostHistory.createMany({
      data: insert,
    });

    return posts.count > 0;
  }

  async createPost({
    name,
    utskott,
    postType,
    spots,
    description,
    interviewRequired,
  }: NewPost): Promise<number> {
    const s = checkPostTypeAndSpots(postType, spots);

    if (s === null) {
      throw new BadRequestError('Inkompatibel posttyp och antal poster');
    }

    // Kolla efter dubbletter först, fånga 404-felet och sätt doubles till false
    const doubles =
      (await prisma.prismaPost.count({
        where: {
          postname: name,
        },
      })) > 0;

    if (doubles) {
      throw new BadRequestError('Denna posten finns redan');
    }

    const { id } = await prisma.prismaPost.create({
      data: {
        postname: name,
        utskott,
        postType,
        spots: s,
        description: description || 'Postbeskrivning saknas :/',
        interviewRequired: interviewRequired ?? false,
        active: true,
      },
    });

    return id;
  }

  /**
   * Modifierar en post
   * @param entry Modifiering av existerande artikel
   */
  async modifyPost(entry: ModifyPost): Promise<boolean> {
    const { id, ...update }: StrictObject = stripObject(entry);

    // Om vi ändrar posttyp eller antal måste detta kontrolleras
    // Får vi spots i `entry` jämför vi med det, annars måste
    // vi kolla om det är kompatibelt med databasen
    // Samma gäller åt andra hållet
    let s: number | null = null;

    if (entry.spots !== undefined) {
      if (entry.postType !== undefined) {
        s = checkPostTypeAndSpots(entry.postType, entry.spots);
      } else {
        // Vi måste kolla i databasen vad denna post har för postType
        const existingPost = await prisma.prismaPost.findFirst({
          where: {
            id: id as number,
          },
          select: {
            postType: true,
          },
        });

        if (existingPost == null) {
          // Should not happen
          return false;
        }

        s = checkPostTypeAndSpots(existingPost.postType as PostType, entry.spots);
      }
    } else if (entry.postType !== undefined) {
      const existingPost = await prisma.prismaPost.count({
        where: {
          id: id as number,
        },
      });

      s = checkPostTypeAndSpots(entry.postType, existingPost);
    } else {
      // Vi vill inte uppdatera något av dem
      const post = await prisma.prismaPost.update({
        where: {
          id: id as number,
        },
        data: update,
      });

      return post != null;
    }

    // Vi ville uppdatera, men vi hade inte en godkännd kombination
    if (s === null) {
      throw new BadRequestError('Ogiltig kombination av post och antal platser');
    }

    const post = await prisma.prismaPost.update({
      where: {
        id: id as number,
      },
      data: {
        ...update,
        spots: s,
      },
    });

    return post != null;
  }

  /**
   * Sätter active-statusen för en post
   * @param id ID för posten
   * @param active Om posten ska vara markerad aktiv
   * @returns Om en uppdatering gjordes
   */
  async setPostStatus(id: number, active: boolean): Promise<boolean> {
    const post = await prisma.prismaPost.update({
      data: {
        active,
      },
      where: {
        id,
      },
    });

    return post != null;
  }

  async getHistoryEntries(where: Prisma.PrismaPostHistoryWhereInput): Promise<PrismaPostHistory[]> {
    const history = await prisma.prismaPostHistory.findMany({
      where,
    });

    return history;
  }

  /**
   * Beräknar antalet unika funktionärer för ett visst
   * datum, eller dagens datum om inget ges. Räknar inte samma
   * användare flera gånger.
   * @param date Ett datum
   */
  async getNumberOfVolunteers(date?: Date): Promise<number> {
    const safeDate = date ?? new Date();

    const count = await prisma.prismaPostHistory.count({
      where: {
        OR: [
          { end: null },
          {
            end: {
              gte: safeDate,
            },
          },
        ],
        AND: {
          start: {
            lte: safeDate,
          },
        },
      },
    });

    return count;
  }

  /**
   * Sätter slutdatumet för en användares post.
   * @param id ID på entriet
   * @param end När posten går av posten
   */
  async setUserPostEnd(id: number, end: Date): Promise<boolean> {
    const post = await prisma.prismaPostHistory.update({
      include: {
        post: true,
        user: true,
      },
      where: {
        id,
      },
      data: {
        end: new Date(midnightTimestamp(end, 'before')),
      },
    });

    return post != null;
  }

  /**
   * Tar bort en `PostHistoryEntry` ur databasen.
   * @param id ID på history entry
   */
  async removeHistoryEntry(id: number): Promise<boolean> {
    const history = await prisma.prismaPostHistory.delete({
      where: {
        id,
      },
    });

    return history != null;
  }

  async clear() {
    await prisma.prismaPostHistory.deleteMany();
    await prisma.prismaPost.deleteMany();
  }

  async clearHistory() {
    await prisma.prismaPostHistory.deleteMany();
  }
}
