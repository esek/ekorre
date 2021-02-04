import { NewArticle, ModifyArticle, Resolvers, ArticleType } from '../graphql.generated';

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
        createdAt: new Date()
      };
      return u;
    },
    article: () => {
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
    }
  },

};

export default articleResolver;