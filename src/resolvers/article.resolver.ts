// Använt av userLoader
// userLoader är ett sätt att cacha User, då dessa
// används på flera olika ställen i API:n. Jag har utgått
// från detta projekt: https://github.com/benawad/graphql-n-plus-one-example
import { ArticleAPI, ArticleModel } from '../api/article.api';
import { useDataLoader } from '../dataloaders';
import { Resolvers } from '../graphql.generated';
import { ArticleResponse } from '../models/mappers';
import { articleReducer } from '../reducers/article.reducer';

const articleApi = new ArticleAPI();

const hydrate = (partial: ArticleModel): ArticleResponse => {
  const { refcreator, reflastupdateby, ...reduced } = partial;
  return {
    ...reduced,
    creator: {
      username: refcreator,
    },
    lastUpdatedBy: {
      username: reflastupdateby,
    },
  };
};

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
      let articleModels: ArticleModel[];

      if (!creator && !after && !before) {
        const apiResponse = await articleApi.getAllNewsArticles();
        if (apiResponse === null) return [];
        articleModels = await articleReducer(apiResponse, safeMarkdown);
      } else {
        const beforeDate = new Date(before ?? Number.MAX_VALUE); // Set really high date if nothing is provided
        const afterDate = new Date(after ?? Number.MIN_VALUE); // Set really low date if nothing is provided

        const apiResponse = await articleApi.getNewsArticlesFromInterval(
          afterDate,
          beforeDate,
          creator ?? undefined,
        );

        articleModels = await articleReducer(apiResponse, safeMarkdown);
      }

      return articleModels.map(hydrate);
    },
    latestnews: async (_, { limit, markdown }) => {
      const safeMarkdown = markdown ?? false;
      let articleModels: ArticleModel[];

      // Om vi inte gett en limit returnerar vi bara alla artiklar
      if (limit) {
        const apiResponse = await articleApi.getLatestNews(limit);
        if (apiResponse === null) return [];
        articleModels = await articleReducer(apiResponse, safeMarkdown);
      } else {
        articleModels = await articleReducer(await articleApi.getAllNewsArticles(), safeMarkdown);
      }

      // If we get no articles, we should just return null directly.
      if (articleModels.length === 0) {
        return [];
      }

      // Vi vill returnera en tom array, inte null
      return articleModels.map(hydrate);
    },
    article: async (_, { id, slug, markdown }) => {
      const safeMarkdown = markdown ?? false; // If markdown not passed, returns default (false)

      // Vi får tillbaka en ArticleModel som inte har en hel användare, bara unikt användarnamn.
      // Vi måste använda UserAPI:n för att få fram denna användare.
      let articleModel = await articleApi.getArticle({ id, slug });

      // Om API::n returnerar null finns inte artikeln; returnera null
      if (articleModel == null) {
        return null;
      }

      articleModel = await articleReducer(articleModel, safeMarkdown);

      return hydrate(articleModel);
    },
    articles: async (_, { ...parameters }) => {
      const { creator, lastUpdateBy, markdown, ...reduced } = parameters;

      const safeMarkdown = markdown ?? false;
      let articleModels: ArticleModel[] | null;

      // If all parameters are empty, we should just return all articles
      // We need to rebind creator and reflastupdater
      // (string, not user) to refcreator and reflastupdater for ArticleModel

      const params = {
        ...reduced,
        refcreator: creator,
        reflastupdateby: lastUpdateBy,
      };

      if (Object.values(params).filter((v) => v).length === 0) {
        // We have no entered paramters
        articleModels = await articleReducer(await articleApi.getAllArticles(), safeMarkdown);
      } else {
        const apiResponse = await articleApi.getArticles(params as Partial<ArticleModel>);
        if (apiResponse === null) return [];
        articleModels = await articleReducer(apiResponse, safeMarkdown);
      }

      // If we get no articles, we should just return null directly.
      if (articleModels.length === 0) {
        return [];
      }

      // Return raw data here, article-resolver will handle mapping of creator and lastupdatedby
      return articleModels.map(hydrate);
    },
  },
  Mutation: {
    addArticle: async (_, { entry }) => hydrate(await articleApi.newArticle(entry)),
    modifyArticle: (_, { articleId, entry }) => articleApi.modifyArticle(articleId, entry),
  },
};

/**
 * Maps an `ArticleModel` i.e. a partial of `Article` to an ArticleResponse object
 * @param partial ArticleModel to be mapped
 * @returns ArticleResponse object with references to `creator` and
 * `lastUpdatedBy`
 */

export default articleResolver;
