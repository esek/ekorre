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
    postAccess: async (_, { postId }, ctx) => {
      await hasAuthenticated(ctx);
      const access = await accessApi.getPostAccess(postId);

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
      return accessApi.setIndividualAccess(username, access, ctx.getUsername());
    },
    setPostAccess: async (_, { postId, access }, ctx) => {
      await hasAccess(ctx, Feature.AccessAdmin);
      return accessApi.setPostAccess(postId, access, ctx.getUsername());
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
    access: async ({ id }) => {
      // Maybe implement API method that takes single postname.
      const postAccess = await accessApi.getPostAccess(id);
      return accessReducer(postAccess);
    },
  },
};

export default accessresolver;
