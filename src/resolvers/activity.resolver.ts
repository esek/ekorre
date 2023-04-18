import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated } from '@/util';
import { ActivityAPI } from '@api/activity';
import { Resolvers, Utskott, Feature } from '@generated/graphql';
import { activityReduce } from '@reducer/activity';

const api = new ActivityAPI();

const activityResolver: Resolvers = {
  Query: {
    activities: async (_, { from, to, utskott }, ctx) => {
      await hasAuthenticated(ctx);
      const a = await api.getActivities(from, to, utskott as Utskott[]);
      return reduce(a, activityReduce);
    },
  },

  Mutation: {
    addActivity: async (_, { activity }, ctx) => {
      await hasAccess(ctx, Feature.ActivityAdmin);
      return api.addActivity(activity);
    },

    removeActivity: async (_, { id }, ctx) => {
      await hasAccess(ctx, Feature.ActivityAdmin);
      return api.removeActivity(id);
    },
  },
};

export default activityResolver;
