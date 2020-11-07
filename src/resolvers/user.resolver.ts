import { Resolvers } from '../graphql.generated';
import UserAPI from '../api/user.api';

const api = new UserAPI();

const userResolver: Resolvers = {
  Query: {
    users: (_, { havingRole }) => {
      if (havingRole != null) return api.getUsersByRole(havingRole);
      return api.getAllUsers();
    },
    user: (_, { username }, ctx) => {
      ctx.getUser();
      return api.getSingleUser(username);
    },
  },
  Mutation: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    login: (_, { username, password }) => api.loginUser(username, password),
    createUser: (_, { input }) => api.createUser(input),
  },
};

export default userResolver;
