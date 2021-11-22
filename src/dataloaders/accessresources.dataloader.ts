import ResourcesAPI from '../api/accessresources.api';
import { NotFoundError } from '../errors/RequestErrors';
import { AccessResource, AccessResourceType } from '../graphql.generated';
import { DatabaseAccessResource } from '../models/db/resource';

// Om vi kör tester beh;ver vi denna konstant
// för att kunna spionera på den
export const api = new ResourcesAPI();

/**
 * Funktion som används för att skapa en DataLoader
 * för att batcha AccessResource-requests och öka prestanda
 * markant
 * @param {string[]} slugs List of slugs to fetch
 */
export const batchAccessResources = async (
  slugs: readonly string[],
): Promise<ArrayLike<AccessResource | Error>> => {
  const apiResponse = await api.getResources(AccessResourceType.Web, [...slugs]);
  if (apiResponse === null) return [];

  // We want array as Map of slug to AccessResource object
  const resourceMap = new Map<string, AccessResource>();

  apiResponse.forEach((resource) => {
    resourceMap.set(resource.slug, resource);
  });

  // All keys need a value; resources without value
  // in map are replaced by error
  const results = apiResponse.map((resource): DatabaseAccessResource | Error => {
    return (
      resourceMap.get(resource.slug) ||
      new NotFoundError(`No result for access resource ${resource.slug}`)
    );
  });

  return results;
};
