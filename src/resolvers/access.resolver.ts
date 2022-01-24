import { AccessAPI } from '@api/access';
import { PostAPI } from '@api/post';
import { Resolvers } from '@generated/graphql';
import { accessReducer } from '@reducer/access';

const accessApi = new AccessAPI();
const postApi = new PostAPI();

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
      const indAccess = await accessApi.getIndividualAccess(username);
      const posts = await postApi.getPostsForUser(username);
      const postNames = posts.map((e) => e.postname);
      const postAccess = await accessApi.getAccessForPosts(postNames, false);

      return accessReducer([...indAccess, ...postAccess]);
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
