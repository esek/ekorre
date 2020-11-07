import { NewsEntry, Resolvers } from '../graphql.generated';

const newsResolver: Resolvers = {
  Query: {
    latestnews: () => {
      const u: NewsEntry = {
        body: '',
        createdAt: new Date(),
        creator: {},
        signature: '',
        title: ''
      };
      return u;
    },
    test: () => new Date(),
  }
};

export default newsResolver;