import ResourcesAPI from '../api/accessresources.api';
import { AccessResource, AccessResourceType } from '../graphql.generated';
import { sortBatchResult } from './util';

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
  if (apiResponse == null) return [];

  return sortBatchResult<string, AccessResource>(slugs, 'slug', apiResponse, 'No result for access resource');
};
