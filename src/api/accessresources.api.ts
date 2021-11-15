import { NotFoundError, ServerError } from '../errors/RequestErrors';
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

  async getResource(slug: string): Promise<DatabaseAccessResource> {
    const resouce = await knex<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE)
      .where({ slug })
      .first();

    if (!resouce) {
      logger.error(`Resource with slug ${slug} not found`);
      throw new NotFoundError(`Resursen ${slug} kunde inte hittas`);
    }

    return resouce;
  }

  async addResource(
    name: string,
    description: string,
    resourceType: AccessResourceType,
  ): Promise<boolean> {
    const id = await knex<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE).insert({
      description,
      name,
      resourceType,
    });

    if (!id.length) {
      const errStr = `Failed to add resource with name ${name}`;
      logger.error(errStr);
      throw new ServerError(errStr);
    }

    return true;
  }

  async removeResouce(slug: string): Promise<boolean> {
    const res = await knex<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE).where({ slug }).delete();

    if (!res) {
      logger.error(`Failed to remove resource with slug ${slug}`);
      throw new NotFoundError(`Resursen ${slug} kunde inte hittas`);
    }

    return true;
  }
}

export default ResourcesAPI;
