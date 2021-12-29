import { ElectionAPI } from '../api/election.api';
import { Logger } from '../logger';
import { ElectionResponse } from '../models/mappers';
import { reduce } from '../reducers';
import { electionReduce } from '../reducers/election/election.reducer';
import { sortBatchResult } from './util';

const logger = Logger.getLogger('ElectionDataLoader');

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
  electionIds: readonly string[],
): Promise<ArrayLike<ElectionResponse | Error>> => {
  /**
   * Batch function used as parameter to DataLoader constructor,
   * see /src/resolvers/README.md
   * @param electionIds
   */
  const apiResponse = await electionApi.getMultipleElections(electionIds);
  if (apiResponse === null) return [];
  const elections = reduce(apiResponse, electionReduce);

  return sortBatchResult<string, ElectionResponse>(electionIds, 'id', elections.map((e) => {
    // IDs i Knex, SQL och GraphQL är rätt fucky
    return {...e, id: e.id?.toString() ?? ''};
  }), 'Election not found');
};
