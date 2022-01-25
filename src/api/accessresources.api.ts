import { NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { DatabaseAccessResource } from '@db/resource';
import { AccessResourceType } from '@generated/graphql';

import { ACCESS_RESOURCES_TABLE } from './constants';
import db from './knex';

const logger = Logger.getLogger('ResourcesAPI');

class ResourcesAPI {
  /**
   * Gets all access resources
   * @param {AccessResource?} type - Optional type of resource to filter by
   * @param {string[]?} slugs - Optional slugs to filter by
   * @returns List of access resources as presented in the database
   */
  async getResources(
    type?: AccessResourceType,
    slugs?: string[],
  ): Promise<DatabaseAccessResource[]> {
    const q = db<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE);

    if (type) {
      q.where('resourceType', type);
    }

    if (slugs) {
      q.whereIn('slug', slugs);
    }

    return q;
  }

  /**
   * Gets a single access resource
   * @param {string} slug - Slug used to find the correct resource
   * @returns Access resources as presented in the database
   */
  async getResource(slug: string): Promise<DatabaseAccessResource> {
    const resouce = await db<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE)
      .where('slug', slug)
      .first();

    if (!resouce) {
      logger.error(`Resource with slug ${slug} not found`);
      throw new NotFoundError(`Resource with slug ${slug} not found`);
    }

    return resouce;
  }

  /**
   * Adds a new access resource
   * @param {string} name Name of the resource
   * @param {string} slug Slug of the resource
   * @param {string} description Description of the resource
   * @param {string} resourceType Type of the resource
   * @returns {boolean} True if successful
   */
  async addResource(
    name: string,
    slug: string,
    description: string,
    resourceType: AccessResourceType,
  ): Promise<boolean> {
    const [id] = await db<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE).insert({
      slug,
      description,
      name,
      resourceType,
    });

    if (!id) {
      logger.error(`Failed to add resource with name ${name}`);
      throw new ServerError(`Resursen ${name} kunde inte skapas`);
    }

    return true;
  }

  /**
   * Removes an access resource
   * @param {string} slug Slug of the resource to remove
   * @returns {boolean} True if successful
   */
  async removeResouce(slug: string): Promise<boolean> {
    const res = await db<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE)
      .where('slug', slug)
      .delete();

    if (!res) {
      logger.error(`Failed to remove resource with slug ${slug}`);
      throw new NotFoundError(`Resursen med slug ${slug} kunde inte hittas`);
    }

    return true;
  }
}

export default ResourcesAPI;
