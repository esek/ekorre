import { ArticleAPI } from '@api/article';
import { articleTagReducer } from '@reducer/article';

// Om vi kör tester behöver vi denna konstant
// för att kunna spionera på den
export const articleApi = new ArticleAPI();

/**
 * Funktion som används för att skapa en DataLoader
 * för att batcha Tag-requests och öka prestanda
 * markant
 * @param artcileIds List of articles to get tags for
 */
export const batchTagsFunction = async (
  articleIds: readonly string[],
): Promise<ArrayLike<string[] | Error>> => {
  const apiResponse = await articleApi.getTagsForArticles(articleIds as string[]);

  if (apiResponse === null)
    return new Array<Error>(articleIds.length).fill(new Error('Article not found'));

  return apiResponse.map(articleTagReducer);
};
