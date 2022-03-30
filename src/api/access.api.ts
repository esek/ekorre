import { Logger } from '@/logger';
import { AccessInput, } from '@generated/graphql';
import { Prisma, PrismaApiKeyAccess, PrismaIndividualAccess, PrismaPostAccess, PrismaResourceType } from '@prisma/client';

import prisma from './prisma';

import { PostAPI } from '@/api/post.api';
import { AccessEntry } from '@/models/access';

const logger = Logger.getLogger('AccessAPI');
const postApi = new PostAPI();

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
  async getIndividualAccess(username: string): Promise<PrismaIndividualAccess[]> {
    const access = await prisma.prismaIndividualAccess.findMany({
      where: {
        refUser: username,
      },
      orderBy: {
        resource: 'desc',
      }
    });

    return access;
  }

  /**
   * Hämta access för en post.
   * @param postname posten
   */
  // TOOD: Migrera till prisma
  async getPostAccess(postname: number): Promise<PrismaPostAccess[]> {
    const access = await prisma.prismaPostAccess.findMany({
      where: {
        refPost: postname,
      },
      orderBy: {
        resource: 'desc',
      }
    });

    return access;
  }

  // TODO: Migrera till prisma
  async getApiKeyAccess(apiKey: string): Promise<PrismaApiKeyAccess[]> {
    const access = await prisma.prismaApiKeyAccess.findMany({
      where: {
        refApiKey: apiKey,
      },
      orderBy: {
        resource: 'desc',
      }
    });

    return access;
  }

  /**
   * Sätt access för en användare. VIKTIGT: Access är icke muterbart
   * vilket innebär att accessobjektet som matas ska innehålla allt
   * som behövs.
   * @param username användaren
   * @param newaccess den nya accessen
   */
  async setIndividualAccess(username: string, newaccess: AccessInput): Promise<boolean> {
    await prisma.prismaIndividualAccess.deleteMany({
      where: {
        refUser: username,
      }
    });

    const { doors, features } = newaccess;
    const access: Prisma.PrismaIndividualAccessUncheckedCreateInput[] = [];

    doors.forEach((door) =>
      access.push({
        refUser: username,
        resourceType: PrismaResourceType.door,
        resource: door as string,
      }),
    );

    features.forEach((feature) =>
      access.push({
        refUser: username,
        resourceType: PrismaResourceType.feature,
        resource: feature,
      }),
    );

    await prisma.prismaIndividualAccess.createMany({
      data: access
    });

    logger.info(`Updated access for user ${username}`);
    logger.debug(`Updated access for user ${username} to ${Logger.pretty(newaccess)}`);
    return true;
  }
  
  async setApiKeyAccess(key: string, newaccess: AccessInput): Promise<boolean> {
    await prisma.prismaApiKeyAccess.deleteMany({
      where: {
        refApiKey: key,
      }
    });

    const { doors, features } = newaccess;
    const access: Prisma.PrismaApiKeyAccessUncheckedCreateInput[] = [];

    doors.forEach((door) =>
      access.push({
        refApiKey: key,
        resourceType: PrismaResourceType.door,
        resource: door as string,
      }),
    );

    features.forEach((feature) =>
      access.push({
        refApiKey: key,
        resourceType: PrismaResourceType.feature,
        resource: feature,
      }),
    );

    await prisma.prismaApiKeyAccess.createMany({
      data: access
    });

    logger.info(`Updated access for key ${key}`);
    logger.debug(`Updated access for key ${key} to ${Logger.pretty(newaccess)}`);
    return true;
  }


  /**
   * Sätt access för en post. VIKTIGT: Access är icke muterbart
   * vilket innebär att accessobjektet som matas ska innehålla allt
   * som behövs.
   * @param postId posten
   * @param newaccess den nya accessen
   */
  async setPostAccess(postId: number, newaccess: AccessInput): Promise<boolean> {
    await prisma.prismaPostAccess.deleteMany({
      where: {
        refPost: postId,
      }
    });

    const { doors, features } = newaccess;
    const access: Prisma.PrismaPostAccessUncheckedCreateInput[] = [];

    doors.forEach((door) =>
      access.push({
        refPost: postId,
        resourceType: PrismaResourceType.door,
        resource: door as string,
      }),
    );

    features.forEach((feature) =>
      access.push({
        refPost: postId,
        resourceType: PrismaResourceType.feature,
        resource: feature,
      }),
    );

    await prisma.prismaPostAccess.createMany({
      data: access
    });

    logger.info(`Updated access for post with id ${postId}`);
    logger.debug(`Updated access for post with id ${postId} to ${Logger.pretty(newaccess)}`);
    return true;
  }

  /**
   * Gets a users entire access, including inherited access from posts
   * @param username The user whose access to get
   * @returns A list of databaseaccess objects
   */
  async getUserFullAccess(username: string): Promise<AccessEntry[]> {
    // Get the individual access for that user
    const individual = this.getIndividualAccess(username);

    // Get the postaccess for that users posts
    const posts = await postApi.getPostsForUser(username, false);

    const postAccess = prisma.prismaPostAccess.findMany({
      where: {
        refPost: {
          in: posts.map(p => p.id)
        },
      },
    });

    const p = await Promise.all([individual, postAccess]);

    const sorted = p.flat().sort((a, b) => a.resource.localeCompare(b.resource));

    // Flatten the array of access from the promises
    return sorted;
  }
}
