import { NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { DatabaseApiKey } from '@db/apikey';
import { randomUUID } from 'crypto';

import { API_KEY_TABLE } from './constants';
import db from './knex';

const logger = Logger.getLogger('ApiKeyAPI');

class ApiKeyAPI {
  async createApiKey(description: string, username: string): Promise<string> {
    const key = randomUUID();

    const res = await db<DatabaseApiKey>(API_KEY_TABLE).insert({
      key,
      description,
      refcreator: username,
    });

    if (res.length === 0) {
      throw new ServerError('Kunde inte skapa ny API nyckel');
    }

    return key;
  }

  async removeApiKey(key: string): Promise<boolean> {
    const res = await db<DatabaseApiKey>(API_KEY_TABLE)
      .where({
        key,
      })
      .del();

    return res > 0;
  }

  async getApiKey(key: string): Promise<DatabaseApiKey> {
    const res = await db<DatabaseApiKey>(API_KEY_TABLE)
      .where({
        key,
      })
      .first();

    if (!res) {
      throw new NotFoundError('Denna API nyckeln finns inte');
    }

    return res;
  }

  async getApiKeys(): Promise<DatabaseApiKey[]> {
    const res = await db<DatabaseApiKey>(API_KEY_TABLE);
    return res;
  }
}

export default ApiKeyAPI;
