import { AccessAPI } from '@api/access';
import { Resolvers } from '@generated/graphql';
import { accessReducer } from '@reducer/access';

const accessApi = new AccessAPI();

const accessresolver: Resolvers = {
  Query: {
    individualAccess: async (_, { username }) => {
      const access = await accessApi.getIndividualAccess(username);

      return accessReducer(access);
    },
    postAccess: async (_, { postname }) => {
      const access = await accessApi.getPostAccess(postname);

      return accessReducer(access);
    },
  },
  Mutation: {
    setIndividualAccess: (_, { username, access }) =>
      accessApi.setIndividualAccess(username, access),
    setPostAccess: (_, { postname, access }) => accessApi.setPostAccess(postname, access),
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
