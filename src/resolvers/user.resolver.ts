import { graphql } from 'graphql';

import { UserAPI } from '../api/user.api';
import { schema } from '../app';
import { invalidateToken, issueToken } from '../auth';
import type { Resolvers } from '../graphql.generated';
import { userReducer } from '../reducers/user.reducer';

const api = new UserAPI();

const userResolver: Resolvers = {
  Query: {
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

      // Detta är sinnessjukt osnyggt... dock nyttjar vi den modulära
      // struktruren och gör att import av en beroende modul krävs
      const query = `{
        user(username: "${username}") {
          username
          name
          lastname
          class
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
      const data = await graphql(schema, query);

      const token = issueToken(data.data?.user);
      return token;
    },
    createUser: (_, { input }) => api.createUser(input),
    logout: (_, { token }) => invalidateToken(token),
  },
};

export default userResolver;
