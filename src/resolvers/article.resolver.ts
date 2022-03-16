// Använt av userLoader
// userLoader är ett sätt att cacha User, då dessa
// används på flera olika ställen i API:n. Jag har utgått
// från detta projekt: https://github.com/benawad/graphql-n-plus-one-example
import { useDataLoader } from '@/dataloaders';
import { ArticleResponse } from '@/models/mappers';
import { reduce } from '@/reducers';
import { ArticleAPI } from '@api/article';
import { Resolvers } from '@generated/graphql';
import { articleReducer } from '@reducer/article';

const articleApi = new ArticleAPI();

/**
 * Maps an `DatabaseArticle` i.e. a partial of `Article` to an ArticleResponse object
 * @param partial DatabaseArticle to be mapped
 * @returns ArticleResponse object with references to `creator` and
 * `lastUpdatedBy`
 */
const articleResolver: Resolvers = {
  Article: {
    // Load creator & lastUpdateBy using dataloader for performace reasons
    author: useDataLoader((model, ctx) => ({
      key: model.author.username,
      dataLoader: ctx.userDataLoader,
    })),
    lastUpdatedBy: useDataLoader((model, ctx) => ({
      key: model.lastUpdatedBy.username,
      dataLoader: ctx.userDataLoader,
    })),
    lastUpdatedAt: (model) => new Date(model.lastUpdatedAt),
    createdAt: (model) => new Date(model.createdAt),
  },
  Query: {
    newsentries: async (_, { creator, after, before }) => {
      let articleResponse: ArticleResponse[];

      if (!creator && !after && !before) {
        const apiResponse = await articleApi.getAllNewsArticles();
        if (apiResponse === null) return [];
        articleResponse = reduce(apiResponse, articleReducer);
      } else {
        const beforeDate = new Date(before ?? Number.MAX_VALUE); // Set really high date if nothing is provided
        const afterDate = new Date(after ?? Number.MIN_VALUE); // Set really low date if nothing is provided

        const apiResponse = await articleApi.getNewsArticlesFromInterval(
          afterDate,
          beforeDate,
          creator ?? undefined,
        );

        articleResponse = reduce(apiResponse, articleReducer);
      }

      return articleResponse;
    },
    latestnews: async (_, { limit }) => {
      let articleResponse: ArticleResponse[];

      // Om vi inte gett en limit returnerar vi bara alla artiklar
      if (limit) {
        const apiResponse = await articleApi.getLatestNews(limit);
        if (apiResponse === null) return [];
        articleResponse = reduce(apiResponse, articleReducer);
      } else {
        articleResponse = reduce(await articleApi.getAllNewsArticles(), articleReducer);
      }

      // If we get no articles, we should just return null directly.
      if (articleResponse.length === 0) {
        return [];
      }

      // Vi vill returnera en tom array, inte null
      return articleResponse;
    },
    article: async (_, { id, slug }) => {
      // Vi får tillbaka en DatabaseArticle som inte har en hel användare, bara unikt användarnamn.
      // Vi måste använda UserAPI:n för att få fram denna användare.
      const apiResponse = await articleApi.getArticle(id ?? undefined, slug ?? undefined);

      // Om API::n returnerar null finns inte artikeln; returnera null
      if (apiResponse == null) {
        return null;
      }

      return reduce(apiResponse, articleReducer);
    },
    articles: async (_, { author, id, tags }) => {
      const articles = await articleApi.getArticles({
        AND: [
          {
            refAuthor: author ?? undefined,
          },
          {
            id: id ?? undefined,
          },
          {
            tags: {
              some: {
                id: {
                  in: tags ?? [],
                },
              },
            },
          },
        ],
      });

      return reduce(articles, articleReducer);
    },
  },
  Mutation: {
    addArticle: async (_, { entry }, ctx) => {
      // Special type of reduce
      const apiResponse = await articleApi.newArticle(ctx.getUsername(), entry);
      return reduce(apiResponse, articleReducer);
    },
    modifyArticle: (_, { articleId, entry }, ctx) =>
      articleApi.modifyArticle(articleId, ctx.getUsername(), entry),
    removeArticle: (_, { articleId }) => articleApi.removeArticle(articleId),
  },
};

export default articleResolver;
