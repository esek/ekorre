import { Article, NewArticle, ModifyArticle, ArticleType, Resolvers } from '../graphql.generated';
import { ArticleAPI } from '../api/article.api';
import { articleReducer } from '../reducers/article.reducer'

const articleApi = new ArticleAPI();

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
    article: (_, { id, markdown }) => {
      markdown = markdown ?? false;  // If markdown not passed, returns default (false)
      return articleReducer(await articleApi.getArticle(id), markdown);
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
