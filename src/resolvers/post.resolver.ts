import { PostAPI } from '../api/post.api';
import { Resolvers } from '../graphql.generated';
import { reduce } from '../reducers';
import { postReduce } from '../reducers/post.reducer';

const api = new PostAPI();

// TODO: Lägg till auth
const postresolver: Resolvers = {
  Query: {
    post: async (_, { name }) => {
      const res = await api.getPost(name);
      if (res != null) return postReduce(res);
      return null;
    },
    posts: async (_, { utskott, includeInactive }) => {
      if (utskott != null) {
        return reduce(await api.getPostsFromUtskott(utskott, includeInactive), postReduce);
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
    activatePost: (_, { postname }) => api.activatePost(postname),
    deactivatePost: (_, { postname }) => api.deactivatePost(postname),
  },
  User: {
    posts: async ({ username }, _, ctx) => {
      const posts = reduce(await api.getPostsForUser(username), postReduce);
      posts.forEach((p) => {
        // Vi vill inte ladda in dessa fler gånger
        // i samma request, så vi sparar dem i vår dataloader
        ctx.postDataLoader.prime(p.postname, p);
      });
      return posts;
    },
    userPostHistory: async ({ username }, _, ctx) => {
      const entries = await api.getHistoryEntriesForUser(username);

      // Vi omvandlar från DatabaseHistoryEntry user history entries
      // genom att hämta ut Posts. Vi använder dataloader
      // då en Post kan hämtas ut flera gånger
      const a = Promise.all(
        entries.map(async (e) => {
          const post = await ctx.postDataLoader.load(e.refpost);

          return { ...e, post };
        }),
      );
      return a;
    },
  },
  Post: {
    history: async ({ postname }, _, ctx) => {
      const entries = await api.getHistoryEntries(postname);

      const a = Promise.all(
        entries.map(async (e) => {
          const holder = await ctx.userDataLoader.load(e.refuser);

          return { ...e, holder, postname };
        }),
      );
      return a;
    },
  },
};

export default postresolver;
