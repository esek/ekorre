import { ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { DatabaseAccess } from '@db/access';
import { DatabasePost, DatabasePostHistory } from '@db/post';
import { Access, AccessInput, AccessResourceType } from '@generated/graphql';

import {
  API_KEY_ACCESS_TABLE,
  IND_ACCESS_TABLE,
  POSTS_HISTORY_TABLE,
  POSTS_TABLE,
  POST_ACCESS_TABLE,
} from './constants';
import db from './knex';

const logger = Logger.getLogger('AccessAPI');

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
  // TODO: Migrera till prisma
  async getIndividualAccess(username: string): Promise<DatabaseAccess[]> {
    const res = await db<DatabaseAccess>(IND_ACCESS_TABLE).where({
      refname: username,
    });

    console.log(access);

    return access;
  }

  /**
   * Hämta access för en post.
   * @param postname posten
   */
  // TOOD: Migrera till prisma
  async getPostAccess(postname: string): Promise<DatabaseAccess[]> {
    const res = await db<DatabaseAccess>(POST_ACCESS_TABLE).where({
      refname: postname,
    });

    return res;
  }

  // TODO: Migrera till prisma
  async getApiKeyAccess(apiKey: string): Promise<DatabaseAccess[]> {
    const res = await db<DatabaseAccess>(API_KEY_ACCESS_TABLE).where({
      refname: apiKey,
    });

    return access;
  }

  /**
   * En hjälpfunktion för att sätta access.
   * @param table tabellen där access raderna finns
   * @param ref referens (användare eller post)
   * @param newaccess den nya accessen
   */
  async setIndividualAccess(username: string, newaccess: string[]): Promise<boolean> {
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
    }

      return inserted.count > 0;
  }

      // TODO: Lös vilken av desssa som är korrekt
  // /**
  //  * Sätt access för en användare. VIKTIGT: Access är icke muterbart
  //  * vilket innebär att accessobjektet som matas ska innehålla allt
  //  * som behövs.
  //  * @param username användaren
  //  * @param newaccess den nya accessen
  //  */
  // async setIndividualAccess(username: string, newaccess: AccessInput): Promise<boolean> {
  //   const status = this.setAccess(IND_ACCESS_TABLE, username, newaccess);

  //   logger.info(`Updated access for user ${username}`);
  //   logger.debug(`Updated access for user ${username} to ${Logger.pretty(newaccess)}`);
  //   return status;
  // }
  
  // TODO: Migrera till prisma
  private async setAccess(table: string, ref: string, newaccess: Access): Promise<boolean> {
    await db<DatabaseAccess>(table)
      .where({
        refname: ref,
      })
      .delete();

    const { doors, features } = newaccess;
    const access: DatabaseAccess[] = [];

    doors.forEach((door) =>
      access.push({
        refname: ref,
        resourcetype: AccessResourceType.Door,
        resource: door as string,
      }),
    );

    features.forEach((feature) =>
      access.push({
        refname: ref,
        resourcetype: AccessResourceType.Feature,
        resource: feature as string,
      }),
    );

    const changedRows = await db<DatabaseAccess>(table).insert(access);

    // Fett oklart men den ska kolla ifall det lyckades
    if (changedRows.some((s) => s <= 0)) {
      throw new ServerError('Failed to set access');
    }

    return true;
  }

  // TODO: Migrera till prisma
  async setApiKeyAccess(key: string, newAccess: AccessInput): Promise<boolean> {
    const status = this.setAccess(API_KEY_ACCESS_TABLE, key, newAccess);

    logger.info(`Updated access for api key ${key}`);
    logger.debug(`Updated access for api key ${key} to ${Logger.pretty(newAccess)}`);
    return status;
  }


  /**
   * Sätt access för en post. VIKTIGT: Access är icke muterbart
   * vilket innebär att accessobjektet som matas ska innehålla allt
   * som behövs.
   * @param postname posten
   * @param newaccess den nya accessen
   */
  // TODO: Port to prisma
// <<<<<<<
//   async setPostAccess(slug: string, newaccess: string[]): Promise<boolean> {
//     // Only do insert with actual values.
//     const inserts = newaccess.map<Omit<PrismaPostAccess, 'id'>>((id) => ({
//       refResource: id,
//       refPost: slug,
//     }));
// =======
//   async setPostAccess(postname: string, newaccess: AccessInput): Promise<boolean> {
//     const status = this.setAccess(POST_ACCESS_TABLE, postname, newaccess);
// >>>>>>>

//     await prisma.prismaPostAccess.deleteMany({
//       where: {
//         refPost: slug,
//       },
//     });

//     if (inserts.length > 0) {
//       const inserted = await prisma.prismaPostAccess.createMany({
//         data: inserts,
//       });

//       return inserted.count > 0;
//     }

//     return false;
//   }

  /**
   * Hämta access för flera poster.
   * TODO: Kanske inkludera referens till post.
   * @param posts posterna
   * @param includeInactivePosts Om inaktiverade posters access ska tas med
   */
  // TODO: Migrate to prisma
  // async getAccessForPosts(
  //   posts: string[],
  //   includeInactivePosts = false,
  // ): Promise<DatabasePostJoinedAccess[]> {
  //   const data = await prisma.prismaPostAccess.findMany({
  //     where: {
  //       refPost: {
  //         in: posts,
  //       },
  //       post: {
  //         active: !includeInactivePosts ?? undefined,
  //       },
  //     },
  //     include: {
  //       resource: true,
  //     },
  //   });
  // ): Promise<DatabaseAccess[]> {
  //   const query = db<DatabaseAccess>(POST_ACCESS_TABLE).whereIn('refname', posts);

  //   return data;
  // }

  /**
   * Gets the users access with respect to what posts they have
   * @param username The user to get
   * @returns A list of all the accessable resources
   */
  // TODO: Migrate to prisma
  // async getUserPostAccess(username: string) {
  //   const res = await db<DatabaseAccess>(POST_ACCESS_TABLE)
  //     .join<DatabasePostHistory>(POSTS_HISTORY_TABLE, 'refpost', 'refname')
  //     .where({
  //       refuser: username,
  //     })
  //     .andWhere((q) => {
  //       // Only fetch active posts
  //       q.whereNull('end').orWhere('end', '>', new Date().getTime());
  //     })
  //     .distinct(); // remove any duplicates

  //   const access = await prisma.prismaPostAccess.findMany({
  //     where: {
  //       post: {
  //         history: {
  //           every: {
  //             AND: [
  //               {
  //                 refUser: username,
  //               },
  //               {
  //                 OR: [
  //                   {
  //                     endDate: null,
  //                   },
  //                   {
  //                     endDate: {
  //                       gt: new Date(),
  //                     },
  //                   },
  //                 ],
  //               },
  //             ],
  //           },
  //         },
  //       },
  //     },
  //     distinct: ['refResource'],
  //     include: {
  //       resource: true,
  //     },
  //   });

  //   return access;
  // }

  /**
   * Gets a users entire access, including inherited access from posts
   * @param username The user whose access to get
   * @returns A list of databaseaccess objects
   */
  async getUserFullAccess(username: string): Promise<DatabaseAccess[]> {
    // Get the individual access for that user
    const individual = this.getIndividualAccess(username);
    // Get the postaccess for that users posts
    const post = this.getUserPostAccess(username);

    const p = await Promise.all([individual, post]);

    // Flatten the array of access from the promises
    return p.flat();
  }
}
