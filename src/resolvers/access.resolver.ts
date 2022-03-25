import { hasAccess, hasAuthenticated } from '@/util';
import { AccessAPI } from '@api/access';
import { Door, Feature, Resolvers } from '@generated/graphql';
import { accessReducer, doorReducer, featureReducer } from '@reducer/access';

const accessApi = new AccessAPI();

const accessresolver: Resolvers = {
  Query: {
    individualAccess: async (_, { username }, ctx) => {
      await hasAuthenticated(ctx);
      const access = await accessApi.getIndividualAccess(username);

      return accessReducer(access);
    },
    postAccess: async (_, { postname }, ctx) => {
      await hasAuthenticated(ctx);
      const access = await accessApi.getPostAccess(postname);

      return accessReducer(access);
    },
    features: () => featureReducer(Object.values(Feature)),
    doors: () => doorReducer(Object.values(Door)),
  },
  Mutation: {
    setApiKeyAccess: async (_, { access, key }, ctx) => {
      await hasAccess(ctx, [Feature.AccessAdmin]);
      return accessApi.setApiKeyAccess(key, access);
    },
    setIndividualAccess: async (_, { username, access }, ctx) => {
      await hasAccess(ctx, Feature.AccessAdmin);
      return accessApi.setIndividualAccess(username, access);
    },
    setPostAccess: async (_, { postname, access }, ctx) => {
      await hasAccess(ctx, Feature.AccessAdmin);
      return accessApi.setPostAccess(postname, access);
    },
  },
  ApiKey: {
    access: async ({ key }) => {
      const access = await accessApi.getApiKeyAccess(key);
      return accessReducer(access);
    },
  },
  User: {
    access: async ({ username }) => {
      const fullAccess = await accessApi.getUserFullAccess(username);

      return accessReducer(fullAccess);
    },
  },
  Post: {
    access: async ({ postname }) => {
      // Maybe implement API method that takes single postname.
      const postAccess = await accessApi.getAccessForPosts([postname]).catch(() => {
        return [];
      });
      return accessReducer(postAccess);
    },
  },
};

export default accessresolver;
