import { NotFoundError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { DatabaseApiKey } from '@db/apikey';
import { createHash } from 'crypto';

import { API_KEY_TABLE } from './constants';
import db from './knex';

const logger = Logger.getLogger('ApiKeyAPI');

class ApiKeyAPI {
  async createApiKey(username: string): Promise<boolean> {
    const res = await db<DatabaseApiKey>(API_KEY_TABLE).insert({
      key: createHash('md5').digest('hex'),
      refcreator: username,
    });

    return res.length > 0;
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
