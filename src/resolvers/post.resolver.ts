import { PostAPI } from '../api/post.api';
import { Post, Resolvers, Utskott } from '../graphql.generated';
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
    groupedPosts: async (_, { includeInactive }) => {
      // Get all posts
      const allPosts = await api.getPosts(undefined, includeInactive);

      // Create temp object to group posts
      const temp: Record<Utskott, Post[]> = {} as Record<Utskott, Post[]>;

      allPosts.forEach((post) => {
        if (!temp[post.utskott]) {
          temp[post.utskott] = [];
        }

        // Add the posts to the object by the utskott
        temp[post.utskott].push(reduce(post, postReduce));
      });

      // map the objects to an array again
      return Object.entries(temp).map(([utskott, posts]) => ({
        utskott: utskott as Utskott,
        posts,
      }));
    },
    numberOfVolunteers: async (_, { date }) => {
      return api.getNumberOfVolunteers(date ?? undefined);
    },
  },
  Mutation: {
    addPost: (_, { info }) => api.createPost(info),
    modifyPost: (_, { info }) => api.modifyPost(info),
    addUsersToPost: (_, { usernames, postname, start, end }) =>
      api.addUsersToPost(usernames, postname, start ?? undefined, end ?? undefined),
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

          // Konvertera timestamp till datum
          const { start, end, ...reduced } = e;
          let safeEnd: Date | null = null;

          if (end != null) {
            safeEnd = new Date(end);
          }

          return { ...reduced,
            post,
            start: new Date(start),
            end: safeEnd
          };
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

          // Konvertera timestamp till datum
          const { start, end, refpost } = e;
          let safeEnd: Date | null = null;

          if (end != null) {
            safeEnd = new Date(end);
          }

          return { postname: refpost,
            holder,
            start: new Date(start),
            end: safeEnd
          };
        }),
      );
      return a;
    },
  },
};

export default postresolver;
