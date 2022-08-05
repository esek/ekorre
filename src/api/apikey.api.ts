import { NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { devGuard } from '@/util';
import { PrismaApiKey } from '@prisma/client';
import { randomUUID } from 'crypto';

import prisma from './prisma';

const logger = Logger.getLogger('ApiKeyAPI');

export class ApiKeyAPI {
  /**
   * Creates a new API key
   * @param description Description of the key
   * @param username The username of the creator of the key
   * @returns The key as a string
   */
  async createApiKey(description: string, username: string): Promise<string> {
    const key = randomUUID();

    try {
      await prisma.prismaApiKey.create({
        data: {
          key,
          description,
          refCreator: username,
        },
      });
    } catch (err) {
      logger.debug(err);
      throw new ServerError('Kunde inte skapa ny API nyckel');
    }

    logger.info(`Created API key ${key}`);
    return key;
  }

  /**
   * Attempts to remove an API key
   * @param key The API key to be removed
   */
  async removeApiKey(key: string): Promise<boolean> {
    try {
      await prisma.prismaApiKey.delete({
        where: {
          key,
        },
      });
    } catch (err) {
      logger.warn(`Could not remove API key ${key}`);
      return false;
    }

    logger.info(`Removed API key ${key}`);
    return true;
  }

  /**
   * Attempts to get an API key
   * @param key The API key string identifier
   */
  async getApiKey(key: string): Promise<PrismaApiKey> {
    const apiKey = await prisma.prismaApiKey.findFirst({
      where: {
        key,
      },
    });

    if (apiKey == null) {
      throw new NotFoundError('Kunde inte hitta API nyckel');
    }

    return apiKey;
  }

  /**
   * Gets multiple API keys, ordered by creation date
   */
  async getApiKeys(): Promise<PrismaApiKey[]> {
    const apiKeys = await prisma.prismaApiKey.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return apiKeys;
  }

  /**
   * Checks if an API key exists
   * @param key The API key string representation
   */
  async checkApiKey(key: string): Promise<boolean> {
    const apiKey = await prisma.prismaApiKey.findFirst({
      where: {
        key,
      },
    });

    return apiKey != null;
  }

  /**
   * Development function to clear all API keys
   */
  async clear() {
    devGuard('Kan inte ta bort API nycklar i produktion');

    await prisma.prismaApiKey.deleteMany();
  }
}
