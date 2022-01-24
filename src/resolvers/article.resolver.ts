// Använt av userLoader
// userLoader är ett sätt att cacha User, då dessa
// används på flera olika ställen i API:n. Jag har utgått
// från detta projekt: https://github.com/benawad/graphql-n-plus-one-example
import { useDataLoader } from '@/dataloaders';
import { ArticleResponse } from '@/models/mappers';
import { ArticleAPI } from '@api/article';
import { DatabaseArticle } from '@db/article';
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
    creator: useDataLoader((model, ctx) => ({
      key: model.creator.username,
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
    newsentries: async (_, { creator, after, before, markdown }) => {
      const safeMarkdown = markdown ?? false;
      let articleResponse: ArticleResponse[];

      if (!creator && !after && !before) {
        const apiResponse = await articleApi.getAllNewsArticles();
        if (apiResponse === null) return [];
        articleResponse = await articleReducer(apiResponse, safeMarkdown);
      } else {
        const beforeDate = new Date(before ?? Number.MAX_VALUE); // Set really high date if nothing is provided
        const afterDate = new Date(after ?? Number.MIN_VALUE); // Set really low date if nothing is provided

        const apiResponse = await articleApi.getNewsArticlesFromInterval(
          afterDate,
          beforeDate,
          creator ?? undefined,
        );

        articleResponse = await articleReducer(apiResponse, safeMarkdown);
      }

      return articleResponse;
    },
    latestnews: async (_, { limit, markdown }) => {
      const safeMarkdown = markdown ?? false;
      let articleResponse: ArticleResponse[];

      // Om vi inte gett en limit returnerar vi bara alla artiklar
      if (limit) {
        const apiResponse = await articleApi.getLatestNews(limit);
        if (apiResponse === null) return [];
        articleResponse = await articleReducer(apiResponse, safeMarkdown);
      } else {
        articleResponse = await articleReducer(await articleApi.getAllNewsArticles(), safeMarkdown);
      }

      // If we get no articles, we should just return null directly.
      if (articleResponse.length === 0) {
        return [];
      }

      // Vi vill returnera en tom array, inte null
      return articleResponse;
    },
    article: async (_, { id, slug, markdown }) => {
      const safeMarkdown = markdown ?? false; // If markdown not passed, returns default (false)

      // Vi får tillbaka en DatabaseArticle som inte har en hel användare, bara unikt användarnamn.
      // Vi måste använda UserAPI:n för att få fram denna användare.
      const apiResponse = await articleApi.getArticle({ id, slug });

      // Om API::n returnerar null finns inte artikeln; returnera null
      if (apiResponse == null) {
        return null;
      }

      const articleResponse = await articleReducer(apiResponse, safeMarkdown);

      return articleResponse;
    },
    articles: async (_, { ...parameters }) => {
      const { creator, lastUpdateBy, markdown, ...reduced } = parameters;

      const safeMarkdown = markdown ?? false;
      let articleResponse: ArticleResponse[] | null;

      // If all parameters are empty, we should just return all articles
      // We need to rebind creator and reflastupdater
      // (string, not user) to refcreator and reflastupdater for DatabaseArticle

      const params = {
        ...reduced,
        refcreator: creator,
        reflastupdateby: lastUpdateBy,
      };

      if (Object.values(params).filter((v) => v).length === 0) {
        // We have no entered paramters
        articleResponse = await articleReducer(await articleApi.getAllArticles(), safeMarkdown);
      } else {
        const apiResponse = await articleApi.getArticles(params as Partial<DatabaseArticle>);
        if (apiResponse === null) return [];
        articleResponse = await articleReducer(apiResponse, safeMarkdown);
      }

      // If we get no articles, we should just return null directly.
      if (articleResponse.length === 0) {
        return [];
      }

      // Return raw data here, article-resolver will handle mapping of creator and lastupdatedby
      return articleResponse;
    },
  },
  Mutation: {
    addArticle: async (_, { entry }, ctx) => {
      // Special type of reduce
      const apiResponse = await articleApi.newArticle(ctx.getUsername(), entry);
      return articleReducer(apiResponse, true);
    },
    modifyArticle: (_, { articleId, entry }, ctx) =>
      articleApi.modifyArticle(articleId, ctx.getUsername(), entry),
    removeArticle: (_, { articleId }) => articleApi.removeArticle(articleId),
  },
};

export default articleResolver;
