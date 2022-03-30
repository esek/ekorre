import { NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { PrismaApiKey } from '@prisma/client';
import { randomUUID } from 'crypto';

import prisma from './prisma';

const logger = Logger.getLogger('ApiKeyAPI');

class ApiKeyAPI {
  async createApiKey(description: string, username: string): Promise<string> {
    const key = randomUUID();

    try {
      await prisma.prismaApiKey.create({data: {
        key,
        description,
        refCreator: username,
      }});
    } catch (err) {
      logger.debug(err);
      throw new ServerError('Kunde inte skapa ny API nyckel');
    }

    logger.info(`Created API key ${key}`);
    return key;
  }

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

  async getApiKey(key: string): Promise<PrismaApiKey> {
    const apiKey = await prisma.prismaApiKey.findFirst({
      where: {
        key,
      }
    });

    if (apiKey == null) {
      throw new NotFoundError('Kunde inte hitta API nyckel');
    }

    return apiKey;
  }

  async getApiKeys(): Promise<PrismaApiKey[]> {
    const apiKeys = await prisma.prismaApiKey.findMany();
    return apiKeys;
  }

  async checkApiKey(key: string): Promise<boolean> {
    const apiKey = await prisma.prismaApiKey.findFirst({
      where: {
        key,
      }
    });

    return apiKey != null;
  }
}

export default ApiKeyAPI;
