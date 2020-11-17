import { AccessAPI } from '../api/access.api';
import { PostAPI } from '../api/post.api';
import { Access, Resolvers } from '../graphql.generated';
import { dependecyGuard } from '../util';

dependecyGuard('access', ['user']);

const accessApi = new AccessAPI();
const postApi = new PostAPI();

const accessresolver: Resolvers = {
  Query: {
    individualAccess: (_, { username }) => accessApi.getIndividualAccess(username),
    postAccess: (_, { postname }) => accessApi.getPostAccess(postname),
  },
  Mutation: {
    setIndividualAccess: (_, { username, access }) => accessApi.setIndividualAccess(username, access),
    setPostAccess: (_, { postname, access }) => accessApi.setPostAccess(postname, access),
  },
  User: {
    access: async ({ username }) => {
      const indAccess = await accessApi.getIndividualAccess(username);
      const posts = await postApi.getPostsForUser(username);
      const postNames = posts.map((e) => e.postname);
      const postAccess = await accessApi.getAccessForPosts(postNames);

      const access: Access = {
        web: [...indAccess.web, ...postAccess.web],
        doors: [...indAccess.doors, ...postAccess.doors],
      };

      return access;
    }
  }
};

export default accessresolver;
