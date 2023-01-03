/* eslint-disable class-methods-use-this */
import config from '@/config';
import { BadRequestError, NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { StrictObject } from '@/models/base';
import { devGuard, midnightTimestamp, stripObject } from '@/util';
import { Maybe, ModifyPost, NewPost, PostType, Utskott } from '@generated/graphql';
import { Prisma, PrismaPost, PrismaPostHistory } from '@prisma/client';

import prisma from './prisma';

const logger = Logger.getLogger('PostAPI');

const defaultOrder: Prisma.PrismaPostOrderByWithRelationAndSearchRelevanceInput[] = [
  { utskott: 'asc' },
  { sortPriority: 'desc' },
  { postname: 'asc' },
];

/**
 * Ensures that post type and number of spots defined are
 * compatible. If this is the case, or a default value
 * can be set, the value is returned. Otherwise `null` is returned
 * @param postType The type of post (unique, exact N spots, N or less etc.)
 * @param spots The number of spots possible entered
 */
const checkPostTypeAndSpots = (
  postType: Maybe<PostType>,
  spots: Maybe<number> | undefined,
): number | null => {
  switch (postType) {
    case PostType.U:
      return 1;
    case PostType.Ea:
      return -1;
    case PostType.N:
    case PostType.ExactN:
      if (spots != null && spots >= 0) {
        return spots;
      }
      break;
    default:
  }

  return null;
};

export class PostAPI {
  /**
   * Removes a post completely. Not to be done in production, as
   * we want to track post histories over the ages
   * @param postId ID of the post to be removed
   * @throws {ServerError} If the environment is not set to development
   */
  async deletePost(postId: number) {
    devGuard('Cannot remove post in production');

    const deleteHistory = prisma.prismaPostHistory.deleteMany({ where: { refPost: postId } });
    const deletePost = prisma.prismaPost.delete({ where: { id: postId } });

    await prisma.$transaction([deleteHistory, deletePost]);
  }
  /**
   * Retrieves all posts, ordered by postname
   * @param limit Maximum number of posts to be retrieved
   * @param includeInactive If inactive posts are to be included
   */
  async getPosts(limit?: number, includeInactive = true): Promise<PrismaPost[]> {
    const where: Prisma.PrismaPostWhereInput = {};

    if (!includeInactive) {
      where.active = true;
    }

    const posts = await prisma.prismaPost.findMany({
      where,
      take: limit,
      orderBy: defaultOrder,
    });

    return posts;
  }

  /**
   * Retrieves a single post
   * @param id ID of the post
   * @throws {NotFoundError} If the post could not be found
   */
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
   * Retrieves multiple posts by IDs, ordered by postname
   * @param ids List of post IDs
   * @param includeInactive If inactive posts are to be included
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
      orderBy: defaultOrder,
    });

    return posts;
  }

  /**
   * Retrieves all posts that an user is or has been assigned to, ordered by postname
   * @param username Username of the user
   * @param includeInactive If inactive posts are to be included
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
      orderBy: defaultOrder,
    });

    return posts;
  }

  /**
   * Retrieves all posts that belongs to an utskott
   * @param utskott The utskott the post belongs to
   * @param includeInactive If inactive posts are to be included
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
      orderBy: defaultOrder,
    });

    return posts;
  }

  /**
   * Adds multiple users to a post, within the dates provided
   * @param usernames List of usernames to be added to the post
   * @param id ID of the post
   * @param start Start of the term
   * @param end End of the term
   */
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

  /**
   * Creates a new post
   * @param name Name of the post
   * @param email E-mail to the post (if it exists)
   * @param utskott The utskott the post belongs to
   * @param postType The type of post (unique, exact N spots, N or less etc.)
   * @param spots The number of spots available per term for this post
   * @param description Description of the post
   * @param interviewRequired If an interview by Valberedningen is required before an election
   * @param active If the post is to be marked as active
   * @param sortPriority The sorting priority of the post
   * @throws {BadRequestError} If the post already exists, or sposts and postType are incompatible
   */
  async createPost({
    name,
    email,
    utskott,
    postType,
    spots,
    description,
    interviewRequired,
    active,
    sortPriority,
  }: NewPost): Promise<PrismaPost> {
    const s = checkPostTypeAndSpots(postType, spots);

    if (s === null) {
      throw new BadRequestError('Inkompatibel posttyp och antal poster');
    }

    // Check for doubles first
    const doubles =
      (await prisma.prismaPost.count({
        where: {
          postname: name,
        },
      })) > 0;

    if (doubles) {
      throw new BadRequestError('Denna posten finns redan');
    }

    const created = await prisma.prismaPost.create({
      data: {
        postname: name,
        email,
        utskott,
        postType,
        sortPriority: sortPriority ?? 0,
        spots: s,
        description: description || 'Postbeskrivning saknas :/',
        interviewRequired: interviewRequired ?? false,
        active: active ?? true,
      },
    });

    return created;
  }

  /**
   * Modifies a post
   * @param entry Modification of existing post
   * @returns If the post was modified
   */
  async modifyPost(entry: ModifyPost): Promise<boolean> {
    const { id, ...update }: StrictObject = stripObject(entry);

    // If we change post type or spots, we need to check compatability
    // If we get both spots and type in `entry`, we check them against eachother,
    // otherwise we check against the database
    let s: number | null = null;

    if (entry.spots !== undefined) {
      if (entry.postType !== undefined) {
        s = checkPostTypeAndSpots(entry.postType, entry.spots);
      } else {
        // Check post type in the database
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
      // We don't want to update any of spots or post type
      const post = await prisma.prismaPost.update({
        where: {
          id: id as number,
        },
        data: update,
      });

      return post != null;
    }

    // We wanted to update, but did not have an approved combination
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
   * Sets the active-status for a post
   * @param id ID for the post
   * @param active If the post is to be marked as active
   * @returns If the update was successfull
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

  /**
   * Retrieves all post history entries for a user, post, or the combination.
   * Only specifying username retrieves all history entries for that user,
   * and only specifying postname retrieves all entries for that post.
   * Orders by start date of the entry first, and then by postname
   * @param username Username of a user
   * @param postId ID of a post
   * @param onlyCurrent If only entries for current term should be returned
   * @param withinAccessCooldown Users who has had a Post retains access for it for some time. If true, includes entries within that time
   * @throws {BadRequestError} If onlyCurrent och withinAccessCooldown are both true
   */
  async getHistoryEntries(
    username?: string,
    postId?: number,
    onlyCurrent = false,
    withinAccessCooldown = false,
  ): Promise<PrismaPostHistory[]> {
    if (onlyCurrent && withinAccessCooldown) {
      throw new BadRequestError('Kan inte returnera inom access cooldown och current samtidigt');
    }

    let or = {};
    if (onlyCurrent) {
      const currentDate = new Date();
      or = {
        AND: [
          { OR: [{ end: null }, { end: { gt: currentDate } }] }, // Must not have passed
          { start: { lt: currentDate } }, // Must have started
        ],
      };
    } else if (withinAccessCooldown) {
      // We want to return posts having ended up to POST_ACCESS_COOLDOWN_DAYS
      // ago
      const lastAccessDate = new Date();
      lastAccessDate.setDate(lastAccessDate.getDate() - config.POST_ACCESS_COOLDOWN_DAYS);
      or = {
        AND: [
          { OR: [{ end: null }, { end: { gt: lastAccessDate } }] },
          { start: { lt: new Date() } }, // Must have started
        ],
      };
    }

    const history = await prisma.prismaPostHistory.findMany({
      where: {
        refUser: username,
        refPost: postId,
        ...or,
      },
      orderBy: [
        {
          start: 'desc',
        },
        // Orderby here need to specify that it is post it wants to order
        ...defaultOrder.map((order) => ({ post: order })),
      ],
    });

    return history;
  }

  /**
   * Calculates the number of unique volunteers for a specific date,
   * or todays date by default. Does not count the same user twice.
   * @param date Date for which to check the number of volunteers at
   */
  async getNumberOfVolunteers(date?: Date): Promise<number> {
    const safeDate = date ?? new Date();

    // Prisma count does not support 'DISTINCT' at time of writing this,
    // update this when it does (docs says they do but they don't)
    const usernames = await prisma.prismaPostHistory.findMany({
      select: {
        refUser: true,
      },
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
      distinct: ['refUser'],
    });

    return usernames.length;
  }

  /**
   * Set the end date (at 23:59:59.999) for a users post
   * @param id ID of the history entry
   * @param end Day at which the persons term ends (time set automatically to 23:59:59.999)
   * @returns If the end date was be set
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
   * Removes a history entry. Should generally be avoided, and `setUserPostEnd` should be used
   * instead
   * @param id ID of the history entry
   * @returns If the entry was removed
   */
  async removeHistoryEntry(id: number): Promise<boolean> {
    const history = await prisma.prismaPostHistory.delete({
      where: {
        id,
      },
    });

    return history != null;
  }

  /**
   * Removes all history entries for a post. Cannot be used outside development
   * @param postId ID of the post for which the history is to be removed
   * @throws {ServerError} If done outside development
   */
  async clearHistoryForPost(postId: number) {
    devGuard('Cannot clear DB in production');

    await prisma.prismaPostHistory.deleteMany({
      where: {
        refPost: postId,
      },
    });
  }

  /**
   * Removes all history entries for a user. Cannot be used outside development
   * @param username Username of the user for which the history is to be removed
   * @throws {ServerError} If done outside development
   */
  async clearHistoryForUser(username: string) {
    devGuard('Cannot clear DB in production');

    await prisma.prismaPostHistory.deleteMany({
      where: {
        refUser: username,
      },
    });
  }
}
