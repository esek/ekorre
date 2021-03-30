// Använt av userLoader
// userLoader är ett sätt att cacha User, då dessa
// används på flera olika ställen i API:n. Jag har utgått
// från detta projekt: https://github.com/benawad/graphql-n-plus-one-example
import { ArticleAPI, ArticleModel } from '../api/article.api';
import { Resolvers } from '../graphql.generated';
import { articleReducer } from '../reducers/article.reducer';

const articleApi = new ArticleAPI();

const articleResolver: Resolvers = {
  Article: {
    // Load creator & lastUpdateBy using dataloader for performace reasons
    creator: async (model: any, _: any, { userDataLoader }) =>
      userDataLoader.load(model.refcreator),
    lastUpdatedBy: async (model: any, _: any, { userDataLoader }) =>
      userDataLoader.load(model.reflastupdateby),
  },
  Query: {
    newsentries: async (_, { creator, after, before, markdown }, _ctx) => {
      const safeMarkdown = markdown ?? false;
      let articleModels: ArticleModel[];

      if (!creator && !after && !before) {
        const apiResponse = await articleApi.getAllNewsArticles();
        if (apiResponse === null) return [];
        articleModels = await articleReducer(apiResponse, safeMarkdown);
      } else {
      }

      return [];
    },
    latestnews: async (_, { limit, markdown }, ctx) => {
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
      if (articleModels?.length === 0) {
        return [];
      }

      // Vi vill returnera en tom array, inte null
      return articleModels as any[];
    },
    article: async (_, { id, markdown }, ctx) => {
      const safeMarkdown = markdown ?? false; // If markdown not passed, returns default (false)

      // Vi får tillbaka en ArticleModel som inte har en hel användare, bara unikt användarnamn.
      // Vi måste använda UserAPI:n för att få fram denna användare.
      let articleModel = await articleApi.getArticle(id);

      // Om API::n returnerar null finns inte artikeln; returnera null
      if (articleModel == null) {
        return null;
      }

      articleModel = await articleReducer(articleModel, safeMarkdown);

      //? Detta är inte så snyggt men vet inte hur man ska göra det eftersom typescript genererar returtypen?
      return articleModel as any;
    },
    articles: async (
      _,
      {
        id,
        creator,
        lastUpdateBy,
        title,
        createdAt,
        lastUpdatedAt,
        signature,
        tags,
        articleType,
        markdown,
      },
    ) => {
      const safeMarkdown = markdown ?? false;
      let articleModels: ArticleModel[] | null;

      // If all parameters are empty, we should just return all articles
      // We need to rebind creator and reflastupdater
      // (string, not user) to refcreator and reflastupdater for ArticleModel

      const params = {
        id,
        refcreator: creator,
        reflastupdateby: lastUpdateBy,
        title,
        createdAt,
        lastUpdatedAt,
        signature,
        tags,
        articleType,
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
      return articleModels as any[];
    },
  },
  Mutation: {
    addArticle: (_, { entry }) => articleApi.newArticle(entry),
    modifyArticle: () => {
      return null;
    },
  },
};

export default articleResolver;
