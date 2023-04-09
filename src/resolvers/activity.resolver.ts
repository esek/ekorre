import { reduce } from '@/reducers';
import { ActivityAPI } from '@api/activity';
import { Resolvers, Utskott } from '@generated/graphql';
import { activityReduce } from '@reducer/activity';

const api = new ActivityAPI();

const activityResolver: Resolvers = {
  Query: {
    activities: async (_, { from, to, utskott }, __) => {
      const a = await api.getActivites(from, to, utskott as Utskott[]);
      return reduce(a, activityReduce);
    },
  },

  Mutation: {
    addActivity: async (_, { activity }, __) => {
      //await hasAccess(ctx, Feature.EventAdmin) add EventAdmin Feature
      return api.addActivity(activity);
    },

    removeActivity: async (_, { id }, __) => {
      //await hasAccess(ctx, Feature.EventAdmin) add EventAdmin Feature
      return api.removeActivity(id);
    },
  },
};

export default activityResolver;
