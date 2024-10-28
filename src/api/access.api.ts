import { PostAPI } from '@/api/post.api';
import { ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { AccessEntry, AccessLogEntry } from '@/models/access';
import { devGuard } from '@/util';
import { AccessInput, Door, Feature } from '@generated/graphql';
import {
  Prisma,
  PrismaApiKeyAccess,
  PrismaIndividualAccess,
  PrismaIndividualAccessLog,
  PrismaPostAccess,
  PrismaPostAccessLog,
  PrismaResourceType,
} from '@prisma/client';
import { assert } from 'console';
import { access } from 'fs';
import { features } from 'process';

import prisma from './prisma';

const logger = Logger.getLogger('AccessAPI');
const postApi = new PostAPI();

/**
 * This is the API that handless access.
 * Access exists in two forms:
 *  - The access that a user inherits from their post(s)
 *  - The access that an individual user gets assigned manually
 * It's important to note the difference
 */
export class AccessAPI {
  /**
   * Get specific access for an user in alphabetical order
   * @param username Username for the user
   */
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
   * Get access for a post in alphabetical order
   * @param postId ID for the post
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
   * Get access for an API key in alphabetical order
   * @param apiKey The API key
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
   *
   * @param incoming old values
   * @param current new values
   * @returns A record describing which elements are not in both arrays with the value true or false depending on
   * if it's only in the incoming or current array
   */
  private getArrDiff(incoming: string[], current: string[]): Record<string, boolean> {
    const differences: Record<string, boolean> = {};

    const incomingSet = new Set(incoming);
    const currentSet = new Set(current);

    for (const item of incoming) {
      if (!currentSet.has(item)) {
        differences[item] = true;
      }
    }

    for (const item of current) {
      if (!incomingSet.has(item)) {
        differences[item] = false;
      }
    }

    return differences;
  }

  /**
   *
   * @param grantor The user giving out permission
   * @param target The user/post which is getting their access changed
   * @param newAccess
   * @param oldAccess
   * @returns getArrDiff calculated for each feature type with info about the grantor and target
   */
  private getAllInputAccessDiff<
    T extends number | string,
    N extends AccessEntry,
    O extends AccessEntry,
  >(grantor: string, target: T, newAccess: N[], oldAccess: O[]): AccessLogEntry<T>[] {
    const log = Object.values(PrismaResourceType).flatMap((resourceType) => {
      const oldResource = oldAccess
        .filter((access) => access.resourceType == resourceType)
        .map((access) => access.resource);
      const newResource = newAccess
        .filter((access) => access.resourceType == resourceType)
        .map((access) => access.resource);

      const resourceDiff = this.getArrDiff(newResource, oldResource);

      const logDiff = Object.entries(resourceDiff).map(([resource, isActive]) => ({
        refGrantor: grantor,
        refTarget: target,
        resourceType: resourceType,
        resource: resource,
        isActive: isActive,
      }));

      return logDiff as AccessLogEntry<T>[];
    });

    return log;
  }

  /**
   * Set the individual access for an user
   *
   * **IMPORTANT**: Access is immutable, which means that the provided access object
   * must contain all individual access desired for the user
   * @param username Username for the user
   * @param newAccess The new individual access for this user
   */
  async setIndividualAccess(
    username: string,
    newAccess: AccessInput,
    grantor: string,
  ): Promise<boolean> {
    const { doors, features } = newAccess;
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

    const deleteQuery = prisma.prismaIndividualAccess.deleteMany({
      where: {
        refUser: username,
      },
    });
    const createQuery = prisma.prismaIndividualAccess.createMany({
      data: access,
    });

    const individualAccessDiff = this.getAllInputAccessDiff(
      grantor,
      username,
      access,
      await this.getIndividualAccess(username),
    );
    const logDiffQuery = prisma.prismaIndividualAccessLog.createMany({
      data: individualAccessDiff,
    });

    let transactionQueries = [deleteQuery, createQuery, logDiffQuery];

    const [, res] = await prisma.$transaction(transactionQueries);

    logger.info(`Updated access for user ${username} by ${grantor}`);
    logger.debug(`Updated access for user ${username} to ${Logger.pretty(newAccess)} by ${grantor}`);

    return res.count === access.length;
  }

  /**
   * Set the access for an API key
   *
   * **IMPORTANT**: Access is immutable, which means that the provided access object
   * must contain all access desired for the API key
   * @param key The API key for which access is to be changed
   * @param newAccess The new access for this API  key
   */
  async setApiKeyAccess(key: string, newAccess: AccessInput): Promise<boolean> {
    const { doors, features } = newAccess;
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

    const deleteQuery = prisma.prismaApiKeyAccess.deleteMany({
      where: {
        refApiKey: key,
      },
    });
    const createQuery = prisma.prismaApiKeyAccess.createMany({
      data: access,
    });

    // Ensure deletion and creation is made in one swoop,
    // so access is not deleted if old one is bad
    const [, res] = await prisma.$transaction([deleteQuery, createQuery]);

    logger.info(`Updated access for key ${key}`);
    logger.debug(`Updated access for key ${key} to ${Logger.pretty(newAccess)}`);
    return res.count === access.length;
  }

  /**
   * Set the access for a post
   *
   * **IMPORTANT**: Access is immutable, which means that the provided access object
   * must contain all access desired for the post
   * @param postId The ID for the user for which acces is to be changed
   * @param newAccess The new access for this post
   */
  async setPostAccess(postId: number, newAccess: AccessInput, grantor: string): Promise<boolean> {
    const { doors, features } = newAccess;
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

    const deleteQuery = prisma.prismaPostAccess.deleteMany({
      where: {
        refPost: postId,
      },
    });
    const createQuery = prisma.prismaPostAccess.createMany({
      data: access,
    });

    const postAccessDiff = this.getAllInputAccessDiff(
      grantor,
      postId,
      access,
      await this.getPostAccess(postId),
    );
    const logDiffQuery = prisma.prismaPostAccessLog.createMany({
      data: postAccessDiff,
    });

    let transactionQueries = [deleteQuery, createQuery, logDiffQuery];

    // Ensure deletion and creation is made in one swoop,
    // so access is not deleted if old one is bad
    const [, res] = await prisma.$transaction(transactionQueries);

    logger.info(`Updated access for post with id ${postId} by ${grantor}`);
    logger.debug(`Updated access for post with id ${postId} to ${Logger.pretty(newAccess)} by ${grantor}`);
    return res.count === access.length;
  }

  async getAllPostLogs(): Promise<PrismaPostAccessLog[]> {
    const values = await prisma.prismaPostAccessLog.findMany({});
    return values;
  }

  async getAllIndividualAccessLogs(): Promise<PrismaIndividualAccessLog[]> {
    const values = await prisma.prismaIndividualAccessLog.findMany({});
    return values;
  }

  /**
   * Gets a users entire access, including inherited access from posts,
   * and is within post access cooldown (users retains post access some time after
   * leaving it)
   * @param username The user whose access to get
   * @returns A list of database access objects
   */
  async getUserFullAccess(username: string): Promise<AccessEntry[]> {
    // Get the individual access for that user
    const individual = this.getIndividualAccess(username);

    // Get the postaccess for that users posts
    // but also posts within retention period (users
    // retain post access for some time after they leave)
    const userPostHistory = await postApi.getHistoryEntries(username, undefined, false, true);
    const postIds = userPostHistory.map((he) => he.refPost);

    const postAccess = prisma.prismaPostAccess.findMany({
      where: {
        refPost: {
          in: postIds,
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

  /**
   * Used for testing
   * Will clear every post accesslog
   */
  async clearPostAccessLog() {
    devGuard('Tried to clear post accesslogs in production!');
    await prisma.prismaPostAccessLog.deleteMany();
  }

  /**
   * Used for testing
   * Will clear every individual accesslog
   */
  async clearIndividualAccessLog() {
    devGuard('Tried to clear individual accesslogs in production!');
    await prisma.prismaIndividualAccessLog.deleteMany();
  }
}
