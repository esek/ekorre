import { ElectionAPI } from '../../api/election.api';
import { NotFoundError, ServerError } from '../../errors/RequestErrors';
import { Logger } from '../../logger';
import { ElectionResponse } from '../../models/mappers';
import { reduce } from '../../reducers';
import { electionReduce } from '../../reducers/election/election.reducer';

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

  // We want array as Map of username to election object
  const electionMap = new Map<string, ElectionResponse>();

  elections.forEach((e) => {
    if (e.id == null) {
      logger.error(
        `Ett oväntat fel påträffades i election-dataloadern; Ett election-ID var null eller undefined, vilket aldrig bör ske.\n Värdet på e var ${JSON.stringify(
          e,
        )}`,
      );
      throw new ServerError('Något gick fel då möten försökte laddas in');
    }
    electionMap.set(e.id, e);
  });

  // All keys need a value; electionnames without value
  // in map are replaced by error
  const results = electionIds.map((id): ElectionResponse | Error => {
    return electionMap.get(id) || new NotFoundError(`No result for election with ID ${id}`);
  });

  return results;
};
