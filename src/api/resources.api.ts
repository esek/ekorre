import { ResourceType } from '../graphql.generated';
import { Logger } from '../logger';
import { DatabaseResource } from '../models/db/resource';
import { RESOURCES_TABLE } from './constants';
import knex from './knex';

const logger = Logger.getLogger('ResourcesAPI');

class ResourcesAPI {
  async getResources(type?: ResourceType): Promise<DatabaseResource[]> {
    const q = knex<DatabaseResource>(RESOURCES_TABLE);

    if (type) {
      return q.where('resourceType', type);
    }

    return q;
  }

  async getResource(id: number): Promise<DatabaseResource> {
    const resouce = await knex<DatabaseResource>(RESOURCES_TABLE).where('id', id).first();

    if (!resouce) {
      logger.error(`Resource with id ${id} not found`);
      throw new Error(`Resource with id ${id} not found`);
    }

    return resouce;
  }

  async addResource(
    name: string,
    description: string,
    resourceType: ResourceType,
  ): Promise<DatabaseResource> {
    const [id] = await knex<DatabaseResource>(RESOURCES_TABLE).insert({
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
    const res = await knex<DatabaseResource>(RESOURCES_TABLE).where('id', id).delete();

    if (!res) {
      logger.error(`Failed to remove resource with id ${id}`);
      return false;
    }

    return true;
  }
}

export default ResourcesAPI;
