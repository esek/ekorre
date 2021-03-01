// Använt av userLoader
// userLoader är ett sätt att cacha User, då dessa
// används på flera olika ställen i API:n. Jag har utgått
// från detta projekt: https://github.com/benawad/graphql-n-plus-one-example
import DataLoader from 'dataloader';
import { Article, NewArticle, ModifyArticle, ArticleType, Resolvers, User } from '../graphql.generated';
import { ArticleAPI, ArticleModel } from '../api/article.api';
import { articleReducer } from '../reducers/article.reducer';
import { userReducer } from '../reducers/user.reducer';
import { UserAPI } from '../api/user.api';


const articleApi = new ArticleAPI();
const userApi = new UserAPI();

const articleResolver: Resolvers = {
  Query: {
    newsentries: async (_, { creator, after, before }, ctx) => {
      return null;
    },
    latestnews: async (_, { limit, markdown }, ctx) => {
      const safeMarkdown = markdown ?? false;
      let articleModels: ArticleModel[];

      // Om vi inte gett en limit returnerar vi bara alla artiklar
      if (limit) {
        const apiResponse = await articleApi.getLatestNews(limit);
        if (apiResponse === null) return null;
        articleModels = await articleReducer(apiResponse, safeMarkdown);
      
      } else {
        articleModels = await articleReducer((await articleApi.getAllNewsArticles()), safeMarkdown);
      }

      // If we get no articles, we should just return null directly.
      if (articleModels.length === 0) {
        return null;
      }

      const userLoader = new DataLoader<string, User>(usernames => ctx.batchUsersFunction(usernames));

      // Måste hitta user för varje artikel, map kallas på varje objekt i vår array
      // Vi skapar Promise för alla funktionsanrop och inväntar att vi skapat en user
      // för varje
      // Vi använder userLoader för att komma ihåg Users vi redan
      // efterfrågat.
      return Promise.all(articleModels.map(async (articleModel) => {
        const creator = await userLoader.load(articleModel.refcreator);
        const lastUpdatedBy = await userLoader.load(articleModel.reflastupdater);
        // Rensar bort referenser från objektet
        const { refcreator, reflastupdater, ...reduced } = articleModel;
        return { creator, lastUpdatedBy, ...reduced };
      }));
    },
    article: async (_, { id, markdown }, ctx) => {      
      const safeMarkdown = markdown ?? false;  // If markdown not passed, returns default (false)
      const userLoader = new DataLoader<string, User>(usernames => ctx.batchUsersFunction(usernames));
      
      // Vi får tillbaka en ArticleModel som inte har en hel användare, bara unikt användarnamn.
      // Vi måste använda UserAPI:n för att få fram denna användare.
      let articleModel = await articleApi.getArticle(id);

      // Om API::n returnerar null finns inte artikeln; returnera null
      if (articleModel == null) {
        return null;
      }

      articleModel = await articleReducer(articleModel, safeMarkdown);
      const creator = await userLoader.load(articleModel.refcreator);
      const lastUpdatedBy = await userLoader.load(articleModel.reflastupdater);

      // Rensar bort referenser från objektet
      const { refcreator, reflastupdater, ...reduced } = articleModel;
      return { creator, lastUpdatedBy, ...reduced };
    },
    articles: async (_, { id, creator, lastUpdateBy, title, createdAt, lastUpdatedAt, signature, tags, articleType, markdown }, ctx) => {
      const safeMarkdown = markdown ?? false;
      let articleModels: ArticleModel[] | null;

      // If all parameters are empty, we should just return all articles
      // We need to rebind creator and reflastupdater
      // (string, not user) to refcreator and reflastupdater for ArticleModel
      const params = { id, refcreator: creator, reflastupdater: lastUpdateBy, title, createdAt, lastUpdatedAt, signature, tags, articleType };
      if (Object.entries(params).length === 0) {
        // We have no entered paramters
        articleModels = await articleReducer((await articleApi.getAllArticles()), safeMarkdown);
      } else {
        const apiResponse = await articleApi.getArticles(params);
        if (apiResponse === null) return null;
        articleModels = await articleReducer(apiResponse, safeMarkdown);
      }

      // If we get no articles, we should just return null directly.
      if (articleModels.length === 0) {
        return null;
      }

      const userLoader = new DataLoader<string, User>(usernames => ctx.batchUsersFunction(usernames));

      // Måste hitta user för varje artikel, map kallas på varje objekt i vår array
      // Vi skapar Promise för alla funktionsanrop och inväntar att vi skapat en user
      // för varje
      // OBS: Är detta illa om varje User dyker upp flera gånger?
      return Promise.all<Article>(articleModels.map(async (articleModel) => {
        // Creator redan i outer scope, men vi binder
        // den till creator i vad vi returnerar senare
        const creatorUser = await userLoader.load(articleModel.refcreator);
        const lastUpdatedBy = await userLoader.load(articleModel.reflastupdater);
        // Rensar bort referenser från objektet
        const { refcreator, reflastupdater, ...reduced } = articleModel;
        return { creator : creatorUser, lastUpdatedBy, ...reduced };
      }));
    }
  },
  Mutation: {
    addArticle: () => {
      return null;
    },
    modifyArticle: () => {
      return null;
    },
  },
};

export default articleResolver;
