import { UserAPI } from '../api/user.api';
import { User } from '../graphql.generated';
import { reduce } from '../reducers';
import { userReduce } from '../reducers/user.reducer';

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
  if (apiResponse === null) return new Array<Error>(usernames.length).fill(new Error('User not found'));

  const users: Array<User> = reduce(apiResponse, userReduce);

  // We want array as Map of username to User object
  const userMap = new Map<string, User>();
  
  users.forEach(u => {
    userMap.set(u.username, u);
  });

  // All keys need a value; usernames without value
  // in map are replaced by error
  const results = usernames.map((name): User | Error => {
    return userMap.get(name) || new Error(`No result for username ${name}`);
  });

  return results;
};
