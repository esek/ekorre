import { Article, NewArticle, ModifyArticle, ArticleType, Resolvers } from '../graphql.generated';

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
    article: (params: Partial<Article>) => {
      return null;
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
