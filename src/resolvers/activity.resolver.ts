import { reduce } from '@/reducers';
import { hasAccess } from '@/util';
import { ActivityAPI } from '@api/activity';
import { Feature, Resolvers, Utskott } from '@generated/graphql';
import { activityReduce } from '@reducer/activity';

const api = new ActivityAPI();

const activityResolver: Resolvers = {
  Query: {
    activities: async (_, { from, to, utskott }, ctx) => {
      const a = await api.getActivites(from, to, utskott as Utskott[]);
      return reduce(a, activityReduce);
    },
  },

  Mutation: {
    addActivity: async (_, { activity }, ctx) => {
      //await hasAccess(ctx, Feature.EventAdmin) add EventAdmin Feature
      return api.addActivity(activity);
    },

    removeActivity: async (_, { id }, ctx) => {
      //await hasAccess(ctx, Feature.EventAdmin) add EventAdmin Feature
      return api.removeActivity(id);
    },
  },
};

export default activityResolver;
