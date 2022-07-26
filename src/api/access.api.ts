import { PostAPI } from '@/api/post.api';
import { ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { AccessEntry } from '@/models/access';
import { devGuard } from '@/util';
import { AccessInput, Door, Feature } from '@generated/graphql';
import {
  Prisma,
  PrismaApiKeyAccess,
  PrismaIndividualAccess,
  PrismaPostAccess,
  PrismaResourceType,
} from '@prisma/client';

import prisma from './prisma';

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
   * Hämta specifik access för en användare i bokstavsordning.
   * @param username användaren
   */
  // TODO: Migrera till prisma
  async getIndividualAccess(username: string): Promise<PrismaIndividualAccess[]> {
    const access = await prisma.prismaIndividualAccess.findMany({
      where: {
        refUser: username,
      },
      orderBy: {
        resource: 'asc',
      },
    });

    return access;
  }

  /**
   * Hämta access för en post i bokstavsordning.
   * @param postId posten
   */
  async getPostAccess(postId: number): Promise<PrismaPostAccess[]> {
    const access = await prisma.prismaPostAccess.findMany({
      where: {
        refPost: postId,
      },
      orderBy: {
        resource: 'asc',
      },
    });

    return access;
  }

  /**
   * Hämta access för en apiNyckel i bokstavsordning.
   * @param apiKey apiNyckeln
   */
  async getApiKeyAccess(apiKey: string): Promise<PrismaApiKeyAccess[]> {
    const access = await prisma.prismaApiKeyAccess.findMany({
      where: {
        refApiKey: apiKey,
      },
      orderBy: {
        resource: 'asc',
      },
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
      },
    });

    const { doors, features } = newaccess;
    const access: Prisma.PrismaIndividualAccessUncheckedCreateInput[] = [];

    doors.forEach((door) => {
      if (!Object.values(Door).includes(door)) {
        throw new ServerError(`${door} är inte en känd dörr`);
      }
      access.push({
        refUser: username,
        resourceType: PrismaResourceType.door,
        resource: door as string,
      });
    });

    features.forEach((feature) => {
      if (!Object.values(Feature).includes(feature)) {
        throw new ServerError(`${feature} är inte en känd feature`);
      }
      access.push({
        refUser: username,
        resourceType: PrismaResourceType.feature,
        resource: feature,
      });
    });

    const res = await prisma.prismaIndividualAccess.createMany({
      data: access,
    });

    logger.info(`Updated access for user ${username}`);
    logger.debug(`Updated access for user ${username} to ${Logger.pretty(newaccess)}`);
    return res.count === access.length;
  }

  async setApiKeyAccess(key: string, newaccess: AccessInput): Promise<boolean> {
    await prisma.prismaApiKeyAccess.deleteMany({
      where: {
        refApiKey: key,
      },
    });

    const { doors, features } = newaccess;
    const access: Prisma.PrismaApiKeyAccessUncheckedCreateInput[] = [];

    doors.forEach((door) => {
      if (!Object.values(Door).includes(door)) {
        throw new ServerError(`${door} är inte en känd dörr`);
      }
      access.push({
        refApiKey: key,
        resourceType: PrismaResourceType.door,
        resource: door as string,
      });
    });

    features.forEach((feature) => {
      if (!Object.values(Feature).includes(feature)) {
        throw new ServerError(`${feature} är inte en känd feature`);
      }
      access.push({
        refApiKey: key,
        resourceType: PrismaResourceType.feature,
        resource: feature,
      });
    });

    const res = await prisma.prismaApiKeyAccess.createMany({
      data: access,
    });

    logger.info(`Updated access for key ${key}`);
    logger.debug(`Updated access for key ${key} to ${Logger.pretty(newaccess)}`);
    return res.count === access.length;
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
      },
    });

    const { doors, features } = newaccess;
    const access: Prisma.PrismaPostAccessUncheckedCreateInput[] = [];

    doors.forEach((door) => {
      if (!Object.values(Door).includes(door)) {
        throw new ServerError(`${door} är inte en känd feature`);
      }
      access.push({
        refPost: postId,
        resourceType: PrismaResourceType.door,
        resource: door as string,
      });
    });

    features.forEach((feature) => {
      if (!Object.values(Feature).includes(feature)) {
        throw new ServerError(`${feature} är inte en känd feature`);
      }
      access.push({
        refPost: postId,
        resourceType: PrismaResourceType.feature,
        resource: feature,
      });
    });

    await prisma.prismaPostAccess.createMany({
      data: access,
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
          in: posts.map((p) => p.id),
        },
      },
      orderBy: {
        resource: 'asc',
      },
    });

    const p = await Promise.all([individual, postAccess]);

    const sorted = p.flat().sort((a, b) => a.resource.localeCompare(b.resource));

    // Flatten the array of access from the promises
    return sorted;
  }

  /**
   * Used for testing
   * Will clear every access for this user!!
   */
  async clearAccessForUser(username: string) {
    devGuard('Tried to clear accesses in production!');

    await prisma.prismaIndividualAccess.deleteMany({
      where: {
        refUser: username,
      },
    });
  }

  /**
   * Used for testing
   * Will clear every access for this user and the posts inherited!!!
   */
  async clearAccessForPost(postId: number) {
    devGuard('Tried to clear accesses in production!');

    await prisma.prismaPostAccess.deleteMany({
      where: {
        refPost: postId,
      },
    });
  }

  /**
   * Used for testing
   * Will clear every access for this user and the posts inherited!!!
   */
  async clearAccessForKey(key: string) {
    devGuard('Tried to clear accesses in production!');

    await prisma.prismaApiKeyAccess.deleteMany({
      where: {
        refApiKey: key,
      },
    });
  }
}
