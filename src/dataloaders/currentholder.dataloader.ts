import { NotFoundError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { PostAPI } from '@api/post';

// Om vi kör tester behöver vi denna konstant
// för att kunna spionera på den
export const postApi = new PostAPI();

/**
 * Function used to create a DataLoader for batching currentHolder-usernames
 * and improving performance significantly
 * @param postIds List of post IDs
 */
export const batchCurrentHoldersFunction = async (
  postIds: readonly number[],
): Promise<ArrayLike<string[] | Error>> => {
  /**
   * Batch function used as parameter to DataLoader constructor,
   * see /src/resolvers/README.md
   * @param postIds
   */
  const apiResponse = await postApi.getCurrentPostHolders([...postIds]);
  if (apiResponse == null) return [];

  const mappedValues = new Map<number, string[]>();
  apiResponse.forEach((v) => {
    mappedValues.set(v.postId, v.usernames);
  });
  
  return postIds.map((pid) => {
    // If this post have no holders, we just return an empty list instead of
    // error
    return mappedValues.get(pid) || [];
  });
};
