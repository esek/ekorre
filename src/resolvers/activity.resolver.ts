import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated } from '@/util';
import { ActivityAPI } from '@api/activity';
import { Feature, Resolvers } from '@generated/graphql';
import { activityReducer } from '@reducer/activity';
import { updateOrbiActivities } from '@service/orbi';

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
      //async call to update orbi because it is
      //painfully slow
      updateOrbiActivities();
      const a = await activityApi.getActivities(from, to, utskott);

      return reduce(a, activityReducer);
    },
  },
  Mutation: {
    addActivity: async (_, { activity }, ctx) => {
      await hasAccess(ctx, Feature.ActivityAdmin);
      const a = await activityApi.addActivity(activity);
      return activityReducer(a);
    },
    modifyActivity: async (_, { id, entry }, ctx) => {
      await hasAccess(ctx, Feature.ActivityAdmin);
      const a = await activityApi.modifyActivity(id, entry);
      return activityReducer(a);
    },
    removeActivity: async (_, { id }, ctx) => {
      await hasAccess(ctx, Feature.ActivityAdmin);
      const a = await activityApi.removeActivity(id);
      return activityReducer(a);
    },
  },
};

export default activityresolver;
