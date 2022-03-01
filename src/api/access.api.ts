import { ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import type { ResolverType } from '@generated/graphql';
import type {
  PrismaAccessResource,
  PrismaIndividualAccess,
  PrismaPostAccess,
} from '@prisma/client';

import prisma from './prisma';

const logger = Logger.getLogger('AccessAPI');

export type DatabaseIndividualJoinedAccess = PrismaIndividualAccess & {
  resource: PrismaAccessResource;
};

export type DatabasePostJoinedAccess = PrismaPostAccess & {
  resource: PrismaAccessResource;
};

/**
 * Det är api:n som hanterar access.
 * Access finns i två former:
 *   - Den access som en användare ärver från en post
 *   - Den access som en specifik användare får tilldelad
 * Det är viktigt att hålla koll på denna skillnaden.
 */
export class AccessAPI {
  /**
   * Hämta specifik access för en användare
   * @param username användaren
   */
  async getIndividualAccess(username: string): Promise<DatabaseIndividualJoinedAccess[]> {
    const access = await prisma.prismaIndividualAccess.findMany({
      where: {
        refUser: username,
      },
      include: {
        resource: true,
      },
    });

    console.log(access);

    return access;
  }

  /**
   * Hämta access för en post.
   * @param postname posten
   */
  async getPostAccess(postname: string): Promise<DatabasePostJoinedAccess[]> {
    const access = await prisma.prismaPostAccess.findMany({
      where: {
        refPost: postname,
      },
      include: {
        resource: true,
      },
    });

    return access;
  }

  /**
   * En private hjälpfunktion för att sätta access.
   * @param table tabellen där access raderna finns
   * @param ref referens (användare eller post)
   * @param newaccess den nya accessen
   */
  private async setIndividualAccess(username: string, newaccess: string[]): Promise<boolean> {
    // Only do insert with actual values.
    const inserts = newaccess.map<Omit<PrismaIndividualAccess, 'id'>>((id) => ({
      refResource: id,
      refUser: username,
    }));

    await prisma.prismaIndividualAccess.deleteMany({
      where: {
        refUser: username,
      },
    });

    if (inserts.length > 0) {
      const inserted = await prisma.prismaIndividualAccess.createMany({
        data: inserts,
      });

      return inserted.count > 0;
    }

    return false;
  }

  /**
   * Sätt access för en post. VIKTIGT: Access är icke muterbart
   * vilket innebär att accessobjektet som matas ska innehålla allt
   * som behövs.
   * @param postname posten
   * @param newaccess den nya accessen
   */
  async setPostAccess(slug: string, newaccess: string[]): Promise<boolean> {
    // Only do insert with actual values.
    const inserts = newaccess.map<Omit<PrismaPostAccess, 'id'>>((id) => ({
      refResource: id,
      refPost: slug,
    }));

    await prisma.prismaPostAccess.deleteMany({
      where: {
        refPost: slug,
      },
    });

    if (inserts.length > 0) {
      const inserted = await prisma.prismaPostAccess.createMany({
        data: inserts,
      });

      return inserted.count > 0;
    }

    return false;
  }

  /**
   * Hämta access för flera poster.
   * TODO: Kanske inkludera referens till post.
   * @param posts posterna
   * @param includeInactivePosts Om inaktiverade posters access ska tas med
   */
  async getAccessForPosts(
    posts: string[],
    includeInactivePosts = false,
  ): Promise<DatabasePostJoinedAccess[]> {
    const data = await prisma.prismaPostAccess.findMany({
      where: {
        refPost: {
          in: posts,
        },
        post: {
          active: !includeInactivePosts ?? undefined,
        },
      },
      include: {
        resource: true,
      },
    });

    return data;
  }

  /**
   * Gets the users access with respect to what posts they have
   * @param username The user to get
   * @returns A list of all the accessable resources
   */
  async getUserPostAccess(username: string): Promise<DatabasePostJoinedAccess[]> {
    // const res = await db<DatabaseAccess>(POST_ACCESS_TABLE)
    //   .join<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE, 'refaccessresource', 'slug')
    //   .join<DatabasePostHistory>(POSTS_HISTORY_TABLE, 'refpost', 'refname')
    //   .where({
    //     refuser: username,
    //   })
    //   .andWhere((q) => {
    //     // Only fetch active posts
    //     q.whereNull('end').orWhere('end', '>', new Date().getTime());
    //   })
    //   .distinct(); // remove any duplicates

    const access = await prisma.prismaPostAccess.findMany({
      where: {
        post: {
          history: {
            every: {
              AND: [
                {
                  refUser: username,
                },
                {
                  OR: [
                    {
                      endDate: null,
                    },
                    {
                      endDate: {
                        gt: new Date(),
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      distinct: ['refResource'],
      include: {
        resource: true,
      },
    });

    return access;
  }

  /**
   * Gets a users entire access, including inherited access from posts
   * @param username The user whose access to get
   * @returns A list of databaseaccess objects
   */
  async getUserFullAccess(
    username: string,
  ): Promise<(DatabasePostJoinedAccess & DatabaseIndividualJoinedAccess)[]> {
    // Get the individual access for that user
    const individual = this.getIndividualAccess(username);
    // Get the postaccess for that users posts
    const post = this.getUserPostAccess(username);

    const p = await Promise.all([individual, post]);

    // Flatten the array of access from the promises
    return p.flat();
  }

  /**
   * Gets the mapping for a resource
   * @param resolverType The type of resource (query or mutation)
   * @param resolverName The name of the resource
   * @returns A list of mappings
   */
  async getAccessMapping(
    resolverName?: string,
    resolverType?: ResolverType,
  ): Promise<DatabaseAccessMapping[]> {
    const q = db<DatabaseAccessMapping>(ACCESS_MAPPINGS_TABLE);

    if (resolverName) {
      q.where({ resolverName });
    }

    if (resolverType) {
      q.where({ resolverType });
    }

    const resources = await q;

    return resources;
  }

  /**
   * Sets (overrides) the mapping for a resolver
   * @param {string} resolverName The name of the resolver
   * @param {string} resolverType The type of the resolver
   * @param {string} slugs The slugs of the resoures to set
   * @returns {boolean} True if successful
   */
  async setAccessMappings(
    resolverName: string,
    resolverType: ResolverType,
    slugs?: string[],
  ): Promise<boolean> {
    const q = db<DatabaseAccessMapping>(ACCESS_MAPPINGS_TABLE);

    await q
      .where({
        resolverName,
        resolverType,
      })
      .delete();

    // if we have anything to add
    if (slugs) {
      try {
        await q.insert(slugs.map((s) => ({ refaccessresource: s, resolverName, resolverType })));
      } catch {
        throw new ServerError('Kunde inte skapa mappningen av resursen');
      }
    }

    return true;
  }
}
