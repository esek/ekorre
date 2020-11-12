import PostAPI from '../api/post.api';
import { Resolvers } from '../graphql.generated';
import { dependecyGuard } from '../util';

dependecyGuard('post', ['user', 'access']);

const api = new PostAPI();

const postresolver: Resolvers = {
  Query: {
    post: (_, { name }) => api.getPost(name),
    posts: (_, { utskott }) => api.getPosts(utskott),
  },
  Mutation: {
    addPost: () => ,
    addUsersToPost: (_, { usernames, postname }) => api.addUsersToPost(usernames, postname),
    removeUsersFromPost: () => ,
  }
};

export default postresolver;