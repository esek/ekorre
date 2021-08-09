import { graphql } from 'graphql';

import { UserAPI } from '../api/user.api';
import { schema } from '../app';
import { invalidateToken, issueToken, verifyToken } from '../auth';
import type { Resolvers, User } from '../graphql.generated';
import { reduce } from '../reducers';
import { userReduce } from '../reducers/user.reducer';
import { stripObject } from '../util';

const api = new UserAPI();

const getUser = (username: string) => {
  // Detta är sinnessjukt osnyggt... dock nyttjar vi den modulära
  // struktruren och gör att import av en beroende modul krävs
  const query = `{
    user(username: "${username}") {
      username
      firstName
      lastName
      email
      class
      photoUrl
      isFuncUser
      access {
        web
        doors
      }
      posts {
        postname
        utskott
      }
    }
  }`;
  return graphql(schema, query);
};

const userResolver: Resolvers = {
  Query: {
    user: async (_, { username }) => {
      // ctx.getUser();
      const u = await api.getSingleUser(username);
      if (u != null) return reduce(u, userReduce);
      return null;
    },
  },
  Mutation: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    login: async (_, { username, password }) => {
      const partialUser = await api.loginUser(username, password);
      if (partialUser == null) return null;

      const data = await getUser(username);

      const token = issueToken(data.data?.user);
      return token;
    },
    updateUser: async (_, { input }, ctx) => {
      const user = ctx.getUser();

      const success = api.updateUser(user.username, stripObject(input));

      return success;
    },
    createUser: (_, { input }) => api.createUser(input),
    logout: (_, { token }) => invalidateToken(token),
    refreshToken: async (_, { token }) => {
      const obj = verifyToken<User>(token);

      const user = await getUser(obj.username);
      return issueToken(user.data?.user);
    },
  },
};

export default userResolver;
