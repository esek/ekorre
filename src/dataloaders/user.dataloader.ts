import { UserAPI } from '../api/user.api';
import { NotFoundError } from '../errors/RequestErrors';
import { User } from '../graphql.generated';
import { reduce } from '../reducers';
import { userReduce } from '../reducers/user.reducer';
import { sortBatchResult } from './util';

// Om vi kör tester beh;ver vi denna konstant
// för att kunna spionera på den
export const userApi = new UserAPI();

/**
 * Funktion som används för att skapa en DataLoader
 * för att batcha User-requests och öka prestanda
 * markant
 * @param usernames List of usernames
 */
export const batchUsersFunction = async (
  usernames: readonly string[],
): Promise<ArrayLike<User | Error>> => {
  /**
   * Batch function used as parameter to DataLoader constructor,
   * see /src/resolvers/README.md
   * @param usernames
   */

  const apiResponse = await userApi.getMultipleUsers(usernames);
  if (apiResponse === null)
    return new Array<Error>(usernames.length).fill(new Error('User not found'));

  const users: Array<User> = reduce(apiResponse, userReduce);

  return sortBatchResult<string, User>(usernames, 'username', users, 'No result for username');
};
