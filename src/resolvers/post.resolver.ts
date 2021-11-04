import { PostAPI } from '../api/post.api';
import { useDataLoader } from '../dataloaders';
import { Post, Resolvers, User } from '../graphql.generated';
import { DatabasePostHistory } from '../models/db/post';
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
    userPostHistory: async ({ username }, _, context) => {
      const entries = await api.getHistoryEntriesForUser(username);

      // Ta ut DataLoadern som finns i denna requestens context för Post, så om fler post
      // efterfrågas i samma requests görs bara en stor batch-query till
      // databasen
      const pdl = useDataLoader<DatabasePostHistory, Post>((entry, ctx) => ({
        key: entry.refpost,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        dataLoader: ctx.postDataLoader,
      }));

      // Vi omvandlar från DatabaseHistoryEntry user history entries
      // genom att hämta ut Posts. Vi använder dataloader
      // då en Post kan hämtas ut flera gånger
      const a = Promise.all(
        entries.map(async (e) => {
          const p = await pdl(e, {}, context);

          const post = reduce(p, postReduce);
          return { ...e, post };
        }),
      );
      return a;
    },
  },
  Post: {
    history: async ({ postname }, _, context) => {
      const entries = await api.getHistoryEntries(postname);
      const udl = useDataLoader<DatabasePostHistory, User>((entry, ctx) => ({
        key: entry.refuser,
        dataLoader: ctx.userDataLoader,
      }));

      const a = Promise.all(
        entries.map(async (e) => {
          const holder = await udl(e, {}, context);

          return { ...e, holder, postname };
        }),
      );
      return a;
    },
  },
};

export default postresolver;
