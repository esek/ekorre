import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated } from '@/util';
import { AccessAPI } from '@api/access';
import ApiKeyAPI from '@api/apikey';
import { AccessResourceType, Door, Feature, Resolvers } from '@generated/graphql';
import { accessReducer, doorReducer, featureReducer } from '@reducer/access';

import { apiKeyReducer } from '../reducers/apikey.reducer';

const accessApi = new AccessAPI();
const apiKeyApi = new ApiKeyAPI();

const accessresolver: Resolvers = {
  Query: {
    apiKey: async (_, { key }, ctx) => {
      hasAccess(ctx, [Feature.Superadmin, Feature.AccessAdmin]);
      const dbKey = await apiKeyApi.getApiKey(key);

      return reduce(dbKey, apiKeyReducer);
    },
    apiKeys: async (_, __, ctx) => {
      hasAccess(ctx, [Feature.Superadmin, Feature.AccessAdmin]);
      const dbKeys = await apiKeyApi.getApiKeys();

      return reduce(dbKeys, apiKeyReducer);
    },
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
    createApiKey: async (_, __, ctx) => {
      hasAccess(ctx, Feature.Superadmin);
      const res = await apiKeyApi.createApiKey(ctx.getUsername());
      return res;
    },
    deleteApiKey: async (_, { key }, ctx) => {
      hasAccess(ctx, Feature.Superadmin);
      const res = await apiKeyApi.removeApiKey(key);
      return res;
    },
    setApiKeyAccess: (_, { access, key }, ctx) => {
      hasAccess(ctx, [Feature.AccessAdmin]);
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
      return accessReducer(access.map((a) => ({ ...a, resourcetype: AccessResourceType.Feature })));
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
