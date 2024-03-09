import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated } from '@/util';
import { ActivityAPI } from '@api/activity';
import { Feature } from '@esek/auth-server';
import { Resolvers } from '@generated/graphql';
import { activityReducer } from '@reducer/activity';

const activityApi = new ActivityAPI();

const activityresolver: Resolvers = {
  Query: {
    activity: async (_, { id }, ctx) => {
      await hasAuthenticated(ctx);
      const a = await activityApi.getActivity(id);

      return activityReducer(a);
    },
    activities: async (_, { from, to, utskott }, ctx) => {
      await hasAuthenticated(ctx);
      const a = await activityApi.getActivities(from, to, utskott);

      return reduce(a, activityReducer);
    },
  },
  Mutation: {
    addActivity: async (_, { activity }, ctx) => {
      await hasAccess(ctx, Feature.Superadmin);
      const a = await activityApi.addActivity(activity);
      return activityReducer(a);
    },
    modifyActivity: async (_, { id, mod }, ctx) => {
      await hasAccess(ctx, Feature.Superadmin);
      const a = await activityApi.modifyActivity(id, mod);
      return activityReducer(a);
    },
    removeActivity: async (_, { id }, ctx) => {
      await hasAccess(ctx, Feature.Superadmin);
      const res = activityApi.removeActivity(id);
      return res;
    },
  },
};

export default activityresolver;
