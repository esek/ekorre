import { PostAPI } from '../api/post.api';
import { Resolvers } from '../graphql.generated';
import { dependecyGuard } from '../util';
import { postHistoryReduce, postReduce, postReducer } from './reducers';

dependecyGuard('post', ['user', 'access']);

const api = new PostAPI();

// TODO: Lägg till auth
const postresolver: Resolvers = {
  Query: {
    post: async (_, { name }) => {
      const res = await api.getPost(name);
      if (res != null) return postReduce(res);
      return null;
    },
    posts: async (_, { utskott }) => {
      if (utskott != null) {
        return postReducer(await api.getPostsFromUtskott(utskott));
      }
      return postReducer(await api.getPosts());
    },
  },
  Mutation: {
    addPost: (_, { info }) => api.createPost(info),
    addUsersToPost: (_, { usernames, postname, period }) =>
      api.addUsersToPost(usernames, postname, period),
    removeUsersFromPost: (_, { usernames, postname }) =>
      api.removeUsersFromPost(usernames, postname),
  },
  User: {
    posts: async ({ username }) => postReducer(await api.getPostsForUser(username)),
  },
  Post: {
    history: async ({ postname }) => postHistoryReduce(postname),
  },
};

export default postresolver;
