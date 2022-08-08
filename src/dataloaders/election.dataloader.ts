import { ElectionResponse } from '@/models/mappers';
import { reduce } from '@/reducers';
import { ElectionAPI } from '@api/election';
import { electionReduce } from '@reducer/election/election';

import { sortBatchResult } from './util';

// Om vi kör tester beh;ver vi denna konstant
// för att kunna spionera på den
export const electionApi = new ElectionAPI();

/**
 * Funktion som används för att skapa en DataLoader
 * för att batcha election-requests och öka prestanda
 * markant
 * @param electionIds List of election IDs
 */
export const batchElectionsFunction = async (
  electionIds: readonly number[],
): Promise<ArrayLike<ElectionResponse | Error>> => {
  /**
   * Batch function used as parameter to DataLoader constructor,
   * see /src/resolvers/README.md
   * @param electionIds
   */
  const apiResponse = await electionApi.getMultipleElections(electionIds);
  if (apiResponse === null) return [];
  const elections = reduce(apiResponse, electionReduce);

  return sortBatchResult<number, ElectionResponse>(
    electionIds,
    'id',
    elections,
    'Election not found (DataLoader)',
  );
};
