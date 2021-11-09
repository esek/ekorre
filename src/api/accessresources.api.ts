import { AccessResourceType } from '../graphql.generated';
import { Logger } from '../logger';
import { DatabaseAccessResource } from '../models/db/resource';
import { ACCESS_RESOURCES_TABLE } from './constants';
import knex from './knex';

const logger = Logger.getLogger('ResourcesAPI');

class ResourcesAPI {
  async getResources(type?: AccessResourceType): Promise<DatabaseAccessResource[]> {
    const q = knex<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE);

    if (type) {
      return q.where('resourceType', type);
    }

    return q;
  }

  async getResource(id: number): Promise<DatabaseAccessResource> {
    const resouce = await knex<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE)
      .where('id', id)
      .first();

    if (!resouce) {
      logger.error(`Resource with id ${id} not found`);
      throw new Error(`Resource with id ${id} not found`);
    }

    return resouce;
  }

  async addResource(
    name: string,
    description: string,
    resourceType: AccessResourceType,
  ): Promise<DatabaseAccessResource> {
    const [id] = await knex<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE).insert({
      description,
      name,
      resourceType,
    });

    if (!id) {
      logger.error(`Failed to add resource with name ${name}`);
      throw new Error();
    }

    return {
      id,
      name,
      description,
      resourceType,
    };
  }

  async removeResouce(id: number): Promise<boolean> {
    const res = await knex<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE).where('id', id).delete();

    if (!res) {
      logger.error(`Failed to remove resource with id ${id}`);
      return false;
    }

    return true;
  }
}

export default ResourcesAPI;
