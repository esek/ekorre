import PostAPI from '../api/post.api';
import { Resolvers } from '../graphql.generated';
import { dependecyGuard } from '../util';

dependecyGuard('post', ['user', 'access']);

const api = new PostAPI();
// TODO: Lägg till auth

const postresolver: Resolvers = {
  Query: {
    post: (_, { name }) => api.getPost(name),
    posts: (_, { utskott }) =>
      utskott != null ? api.getPostsFromUtskott(utskott) : api.getPosts(),
  },
  Mutation: {
    addPost: (_, { info }) => api.createPost(info),
    addUsersToPost: (_, { usernames, postname }) => api.addUsersToPost(usernames, postname),
    removeUsersFromPost: (_, { usernames, postname }) =>
      api.removeUsersFromPost(usernames, postname),
  },
};

export default postresolver;
