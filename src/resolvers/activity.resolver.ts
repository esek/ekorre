import { reduce } from '@/reducers';
import { hasAccess } from '@/util';
import { ActivityAPI } from '@api/activity';
import { Feature, Resolvers } from '@generated/graphql';
import { activityReducer } from '@reducer/activity';

const activityApi = new ActivityAPI();

const activityresolver: Resolvers = {
  Query: {
    activity: async (_, { id }, __) => {
      const activity = await activityApi.getActivity(id);

      return activityReducer(activity);
    },
    activities: async (_, { from, to, utskott, includeHidden }, __) => {
      const activities = await activityApi.getActivities(from, to, utskott, includeHidden ?? false);

      return reduce(activities, activityReducer);
    },
  },
  Mutation: {
    addActivity: async (_, { activity }, ctx) => {
      await hasAccess(ctx, Feature.ActivityAdmin);
      const addedActivity = await activityApi.addActivity(activity);
      return activityReducer(addedActivity);
    },
    modifyActivity: async (_, { id, entry }, ctx) => {
      await hasAccess(ctx, Feature.ActivityAdmin);
      const modifiedActivity = await activityApi.modifyActivity(id, entry);
      return activityReducer(modifiedActivity);
    },
    removeActivity: async (_, { id }, ctx) => {
      await hasAccess(ctx, Feature.ActivityAdmin);
      const removedActivity = await activityApi.removeActivity(id);
      return activityReducer(removedActivity);
    },
  },
};

export default activityresolver;
