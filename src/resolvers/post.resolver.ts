import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated } from '@/util';
import { PostAPI } from '@api/post';
import { Feature, Post, Resolvers, Utskott } from '@generated/graphql';
import { postReduce } from '@reducer/post';

const api = new PostAPI();

// TODO: Lägg till auth
const postresolver: Resolvers = {
  Query: {
    post: async (_, { name }, ctx) => {
      hasAuthenticated(ctx);
      const res = await api.getPost(name);
      if (res != null) return postReduce(res);
      return null;
    },
    posts: async (_, { utskott, includeInactive }, ctx) => {
      hasAuthenticated(ctx);
      if (utskott != null) {
        return reduce(await api.getPostsFromUtskott(utskott, includeInactive), postReduce);
      }
      return reduce(await api.getPosts(), postReduce);
    },
    groupedPosts: async (_, { includeInactive }, ctx) => {
      hasAuthenticated(ctx);
      // Get all posts
      const allPosts = await api.getPosts(undefined, includeInactive);

      // Create temp object to group posts
      const temp: Record<Utskott, Post[]> = {} as Record<Utskott, Post[]>;

      allPosts.forEach((post) => {
        if (!temp[post.utskott]) {
          temp[post.utskott] = [];
        }

        const reducedPost = reduce(post, postReduce);

        ctx.postDataLoader.prime(reducedPost.postname, reducedPost);

        // Add the posts to the object by the utskott
        temp[post.utskott].push(reducedPost);
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
    addPost: (_, { info }, ctx) => {
      hasAccess(ctx, Feature.PostAdmin);
      return api.createPost(info);
    },
    modifyPost: (_, { info }, ctx) => {
      hasAccess(ctx, Feature.PostAdmin);
      return api.modifyPost(info);
    },
    addUsersToPost: (_, { usernames, postname, start, end }, ctx) => {
      hasAccess(ctx, Feature.PostAdmin);
      return api.addUsersToPost(usernames, postname, start ?? undefined, end ?? undefined);
    },
    activatePost: (_, { postname }, ctx) => {
      hasAccess(ctx, Feature.PostAdmin);
      return api.activatePost(postname);
    },
    deactivatePost: (_, { postname }, ctx) => {
      hasAccess(ctx, Feature.PostAdmin);
      return api.deactivatePost(postname);
    },
    setUserPostEnd: (_, { username, postname, start, end }, ctx) => {
      hasAccess(ctx, Feature.PostAdmin);
      return api.setUserPostEnd(username, postname, start, end);
    },
    removeHistoryEntry: (_, { username, postname, start, end }, ctx) => {
      hasAccess(ctx, Feature.PostAdmin);
      return api.removeHistoryEntry(username, postname, start, end ?? undefined);
    }
  },
  User: {
    posts: async ({ username }, _, ctx) => {
      const posts = await api.getPostsForUser(username).catch(() => []);
      const reduced = reduce(posts, postReduce);

      reduced.forEach((p) => {
        // Vi vill inte ladda in dessa fler gånger
        // i samma request, så vi sparar dem i vår dataloader
        ctx.postDataLoader.prime(p.postname, p);
      });

      return reduced;
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

          return { ...reduced, post, start: new Date(start), end: safeEnd };
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

          return { postname: refpost, holder, start: new Date(start), end: safeEnd };
        }),
      );
      return a;
    },
  },
};

export default postresolver;
