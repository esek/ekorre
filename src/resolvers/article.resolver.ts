import { Article, NewArticle, ModifyArticle, ArticleType, Resolvers } from '../graphql.generated';
import { ArticleAPI } from '../api/article.api';
import { UserAPI } from '../api/user.api';
import { userReducer } from '../reducers/user.reducer';
import { articleReducer } from '../reducers/article.reducer'

const articleApi = new ArticleAPI();
const userApi = new UserAPI();

const articleResolver: Resolvers = {
  Query: {
    newsentries: () => {
      return null;
    },
    latestnews: () => {
      // Testtesttest
      const u: NewArticle = {
        creator: '',
        title: '',
        body: '',
        signature: '',
        tags: [''],
        createdAt: new Date(),
      };
      return u;
    },
    article: async (_, { id, markdown }) => {
      markdown = markdown ?? false;  // If markdown not passed, returns default (false)
      // Vi får tillbaka en ArticleModel som inte har en hel användare, bara unikt användarnamn.
      // Vi måste använda UserAPI:n för att få fram denna användare.
      const articleModel = await articleReducer((await articleApi.getArticle(id!))!, markdown);
      const creator = await userReducer((await userApi.getSingleUser(articleModel.refuser))!);
      const { refuser, ...reduced } = articleModel;
      return { creator, ...reduced };
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
