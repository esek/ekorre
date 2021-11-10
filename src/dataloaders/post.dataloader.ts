import { PostAPI } from '../api/post.api';
import { Post } from '../graphql.generated';
import { reduce } from '../reducers';
import { postReduce } from '../reducers/post.reducer';

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
  if (apiResponse === null) return [];
  const posts = reduce(apiResponse, postReduce);

  // We want array as Map of username to Post object
  const postMap = new Map<string, Post>();
    
  posts.forEach(p => {
    postMap.set(p.postname, p);
  });

  // All keys need a value; postnames without value
  // in map are replaced by error
  const results = postnames.map((name): Post | Error => {
    return postMap.get(name) || new Error(`No result for postname ${name}`);
  });

  return results;
};
