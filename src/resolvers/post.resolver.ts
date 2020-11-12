import { Resolvers } from '../graphql.generated';
import { dependecyGuard } from '../util';

dependecyGuard('post', ['user', 'access']);

const api = new PostAPI();

const postresolver: Resolvers = {
  Query: {
    post: (_, { name }) => ,
    posts: (_, { utskott }) => ,
  },
  Mutation: {
    addPost: () => ,
    addUsersToPost: () => ,
    removeUsersFromPost: () => ,
  }
};

export default postresolver;