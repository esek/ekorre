import { UserAPI } from '../api/user.api';
import auth from '../auth';
import type { Resolvers } from '../graphql.generated';
import { dependecyGuard } from '../util';
import { userReducer } from './reducers';

dependecyGuard('user', ['access']);

const api = new UserAPI();

const a: Resolvers = {
  Query: {
    users: async (_, { postname }) => {
      if (postname != null) return userReducer(await api.getUsersByPost(postname));
      return userReducer(await api.getAllUsers());
    },
    user: async (_, { username }) => {
      // ctx.getUser();
      const u = await api.getSingleUser(username);
      if (u != null) return userReducer(u);
      return null;
    },
  },
  Mutation: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    login: async (_, { username, password }) => {
      const partialUser = await api.loginUser(username, password);
      if (partialUser == null) return null;
      const user = await userReducer(partialUser);
      const token = auth.issueToken(user);
      return token;
    },
    createUser: (_, { input }) => api.createUser(input),
  },
};

export default a;
