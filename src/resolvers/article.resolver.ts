import { Article, NewArticle, ModifyArticle, ArticleType, ArticleModel, Resolvers } from '../graphql.generated';
import { ArticleAPI } from '../api/article.api';
import { UserAPI } from '../api/user.api';
import { userReducer } from '../reducers/user.reducer';
import { articleReducer } from '../reducers/article.reducer';

const articleApi = new ArticleAPI();
const userApi = new UserAPI();

const articleResolver: Resolvers = {
  Query: {
    newsentries: async (_, {}) => {
      return null;
    },
    latestnews: async (_, { limit, markdown }) => {
      markdown = markdown ?? false;
      let articleModels: ArticleModel[];

      // Om vi inte gett en limit returnerar vi bara alla artiklar
      if (limit) {
        articleModels = await articleReducer((await articleApi.getLatestNews(limit)), markdown);
      } else {
        articleModels = await articleReducer((await articleApi.getAllNewsArticles()), markdown);
      }

      // Måste hitta user för varje artikel, map kallas på varje objekt i vår array
      // Vi skapar Promise för alla funktionsanrop och inväntar att vi skapat en user
      // för varje
      //OBS: Är detta illa om varje User dyker upp flera gånger?
      return await Promise.all(articleModels.map(async (articleModel) => {
        const creator = await userReducer((await userApi.getSingleUser(articleModel.refcreator))!);
        const lastUpdatedBy = await userReducer((await userApi.getSingleUser(articleModel.reflastupdater))!);
        // Rensar bort referenser från objektet
        const { refcreator, reflastupdater, ...reduced } = articleModel;
        return { creator, lastUpdatedBy, ...reduced };
      }));
    },
    article: async (_, { id, markdown }) => {
      markdown = markdown ?? false;  // If markdown not passed, returns default (false)
      // Vi får tillbaka en ArticleModel som inte har en hel användare, bara unikt användarnamn.
      // Vi måste använda UserAPI:n för att få fram denna användare.
      const articleModel = await articleReducer((await articleApi.getArticle(id!))!, markdown);
      const creator = await userReducer((await userApi.getSingleUser(articleModel.refcreator))!);
      const lastUpdatedBy = await userReducer((await userApi.getSingleUser(articleModel.reflastupdater))!);
      // Rensar bort referenser från objektet
      const { refcreator, reflastupdater, ...reduced } = articleModel;
      return { creator, lastUpdatedBy, ...reduced };
    },
    test: () => new Date(),
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
