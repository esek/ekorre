import { PostAPI } from '../api/post.api';
import { NotFoundError } from '../errors/RequestErrors';
import { Post } from '../graphql.generated';
import { reduce } from '../reducers';
import { postReduce } from '../reducers/post.reducer';
import { sortBatchResult } from './util';

// Om vi kör tester beh;ver vi denna konstant
// för att kunna spionera på den
export const postApi = new PostAPI();

/**
 * Funktion som används för att skapa en DataLoader
 * för att batcha Post-requests och öka prestanda
 * markant
 * @param postnames List of postnames
 */
export const batchPostsFunction = async (
  postnames: readonly string[],
): Promise<ArrayLike<Post | Error>> => {
  /**
   * Batch function used as parameter to DataLoader constructor,
   * see /src/resolvers/README.md
   * @param postnames
   */
  const apiResponse = await postApi.getMultiplePosts(postnames);
  if (apiResponse == null) return [];

  const posts = reduce(apiResponse, postReduce);

  return sortBatchResult<string, Post>(postnames, 'postname', posts, 'No result for post');
};
