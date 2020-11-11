import UserAPI from '../api/user.api';
import type { Resolvers } from '../graphql.generated';
import { dependecyGuard } from '../util';

dependecyGuard('user', ['access']);

const api = new UserAPI();

const a: Resolvers = {
  Query: {
    users: (_, { rolenname }) => {
      if (rolenname != null) return api.getUsersByRole(rolenname);
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

export default a;
