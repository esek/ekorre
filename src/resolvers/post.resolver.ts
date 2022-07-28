import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated } from '@/util';
import { PostAPI } from '@api/post';
import { Feature, Post, Resolvers, Utskott } from '@generated/graphql';
import { postReduce } from '@reducer/post';

const api = new PostAPI();

const postresolver: Resolvers = {
  Query: {
    post: async (_, { id }, ctx) => {
      await hasAuthenticated(ctx);
      const res = await api.getPost(id);
      return postReduce(res);
    },
    posts: async (_, { utskott, includeInactive }, ctx) => {
      await hasAuthenticated(ctx);
      if (utskott != null) {
        const res = await api.getPostsFromUtskott(utskott, includeInactive ?? false);
        return reduce(res, postReduce);
      }
      return reduce(await api.getPosts(), postReduce);
    },
    groupedPosts: async (_, { includeInactive }, ctx) => {
      await hasAuthenticated(ctx);
      // Get all posts
      const allPosts = await api.getPosts(undefined, includeInactive ?? false);

      // Create temp object to group posts
      const temp: Record<Utskott, Post[]> = {} as Record<Utskott, Post[]>;

      allPosts.forEach((post) => {
        if (!temp[post.utskott]) {
          temp[post.utskott] = [];
        }

        const reducedPost = reduce(post, postReduce);

        ctx.postDataLoader.prime(reducedPost.id, reducedPost);

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
    addPost: async (_, { info }, ctx) => {
      await hasAccess(ctx, Feature.PostAdmin);
      const post = await api.createPost(info);

      return reduce(post, postReduce);
    },
    modifyPost: async (_, { info }, ctx) => {
      await hasAccess(ctx, Feature.PostAdmin);
      return api.modifyPost(info);
    },
    addUsersToPost: async (_, { usernames, id, start, end }, ctx) => {
      await hasAccess(ctx, Feature.PostAdmin);

      await api.addUsersToPost(usernames, id, start ?? undefined, end ?? undefined);

      const res = await api.getPost(id);
      return postReduce(res);
    },
    activatePost: async (_, { id }, ctx) => {
      await hasAccess(ctx, Feature.PostAdmin);
      return api.setPostStatus(id, true);
    },
    deactivatePost: async (_, { id }, ctx) => {
      await hasAccess(ctx, Feature.PostAdmin);
      return api.setPostStatus(id, false);
    },
    setUserPostEnd: async (_, { id, end }, ctx) => {
      await hasAccess(ctx, Feature.PostAdmin);
      return api.setUserPostEnd(id, end);
    },
    removeHistoryEntry: async (_, { id }, ctx) => {
      await hasAccess(ctx, Feature.PostAdmin);
      return api.removeHistoryEntry(id);
    },
  },
  User: {
    posts: async ({ username }, _, ctx) => {
      const posts = await api.getPostsForUser(username).catch(() => []);
      const reduced = reduce(posts, postReduce);

      reduced.forEach((p) => {
        // Vi vill inte ladda in dessa fler gånger
        // i samma request, så vi sparar dem i vår dataloader
        ctx.postDataLoader.prime(p.id, p);
      });

      return reduced;
    },
    postHistory: async ({ username }, { current }, ctx) => {
      const entries = await api.getHistoryEntries({ refUser: username }, current ?? false);

      // Vi omvandlar från DatabaseHistoryEntry user history entries
      // genom att hämta ut Posts. Vi använder dataloader
      // då en Post kan hämtas ut flera gånger
      const a = Promise.all(
        entries.map(async (e) => {
          const post = await ctx.postDataLoader.load(e.refPost);

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
    history: async ({ id }, { current }, ctx) => {
      const entries = await api.getHistoryEntries({ refPost: id }, current ?? false);

      const a = Promise.all(
        entries.map(async (e) => {
          const holder = await ctx.userDataLoader.load(e.refUser);

          // Konvertera timestamp till datum
          const { start, end, id: entryId } = e;
          let safeEnd: Date | null = null;

          if (end != null) {
            safeEnd = new Date(end);
          }

          return { id: entryId, holder, start: new Date(start), end: safeEnd };
        }),
      );
      return a;
    },
  },
};

export default postresolver;
