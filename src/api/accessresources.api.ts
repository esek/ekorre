import { NotFoundError, ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { AccessResourceType } from '@generated/graphql';
import { PrismaAccessResource, PrismaResourceType } from '@prisma/client';

import prisma from './prisma';

const logger = Logger.getLogger('ResourcesAPI');

class ResourcesAPI {
  /**
   * Gets all access resources
   * @param {AccessResource?} type - Optional type of resource to filter by
   * @param {string[]?} slugs - Optional slugs to filter by
   * @returns List of access resources as presented in the database
   */
  async getResources(type?: PrismaResourceType, slugs?: string[]): Promise<PrismaAccessResource[]> {
    const resources = await prisma.prismaAccessResource.findMany({
      where: {
        AND: [
          {
            resourceType: type,
          },
          {
            slug: {
              in: slugs,
            },
          },
        ],
      },
    });

    return resources;
  }

  /**
   * Gets a single access resource
   * @param {string} slug - Slug used to find the correct resource
   * @returns Access resources as presented in the database
   */
  async getResource(slug: string): Promise<PrismaAccessResource> {
    const resource = await prisma.prismaAccessResource.findFirst({
      where: {
        slug,
      },
    });

    if (!resource) {
      logger.error(`Resource with slug ${slug} not found`);
      throw new NotFoundError(`Resource with slug ${slug} not found`);
    }

    return resource;
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
    const resource = await prisma.prismaAccessResource.create({
      data: {
        slug,
        description,
        name,
        resourceType,
      },
    });

    if (!resource) {
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
    const resource = await prisma.prismaAccessResource.delete({
      where: {
        slug,
      },
    });

    if (!resource) {
      logger.error(`Failed to remove resource with slug ${slug}`);
      throw new NotFoundError(`Resursen med slug ${slug} kunde inte hittas`);
    }

    return true;
  }
}

export default ResourcesAPI;
