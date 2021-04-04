import { UserAPI } from '../api/user.api';
import { User } from '../graphql.generated';
import { userReducer } from '../reducers/user.reducer';

const userApi = new UserAPI();

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
  if (apiResponse === null) return [];
  const users = await userReducer(apiResponse);

  return users;
};
