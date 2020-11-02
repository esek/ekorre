import { Resolvers } from '../graphql.generated';
import AccessAPI from '../api/access.api';

const api = new AccessAPI();

const a: Resolvers = {
  Query: {
    userAccess: (_, { username }) => {
      if (username != null) return api.getAccessByUsername(username);
      return {}; // Eller?
    },
    postAccess: (_, { name }, ctx) => {
      if (name != null) return api.getAccessByPosts(name);
      return {};
    },
    roleAccess: (_, { role }, ctx) => {
        if (role != null) return api.getAccessByRoles(role);
        return {};
    }
  },
};

export default a;