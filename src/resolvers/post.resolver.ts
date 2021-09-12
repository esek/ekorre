import { PostAPI } from '../api/post.api';
import { UserAPI } from '../api/user.api';
import { Resolvers } from '../graphql.generated';
import { reduce } from '../reducers';
import { postReduce } from '../reducers/post.reducer';
import { userReduce } from '../reducers/user.reducer';

const api = new PostAPI();
const userApi = new UserAPI();

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
        return reduce(await api.getPostsFromUtskott(utskott), postReduce);
      }
      return reduce(await api.getPosts(), postReduce);
    },
  },
  Mutation: {
    addPost: (_, { info }) => api.createPost(info),
    modifyPost: (_, { info }) => api.modifyPost(info),
    addUsersToPost: (_, { usernames, postname, period }) =>
      api.addUsersToPost(usernames, postname, period),
    removeUsersFromPost: (_, { usernames, postname }) =>
      api.removeUsersFromPost(usernames, postname),
  },
  User: {
    posts: async ({ username }) => reduce(await api.getPostsForUser(username), postReduce),
  },
  Post: {
    history: async ({ postname }) => {
      const entries = await api.getHistoryEntries(postname);
      const a = Promise.all(
        entries.map(async (e) => {
          const h = await userApi.getSingleUser(e.refuser);
          // Null assertion används här för den bakomliggande databasen
          // Ska ha foregin key constraint
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const holder = reduce(h!, userReduce);

          return { ...e, holder, postname };
        }),
      );
      return a;
    },
  },
};

export default postresolver;
