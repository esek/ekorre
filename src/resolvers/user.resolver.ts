import { graphql } from 'graphql';

import { UserAPI } from '../api/user.api';
import { schema } from '../app';
import { hashWithSecret, invalidateToken, issueToken, verifyToken } from '../auth';
import type { Resolvers, User } from '../graphql.generated';
import { Logger } from '../logger';
import { reduce } from '../reducers';
import { userReduce } from '../reducers/user.reducer';
import { validateCasTicket } from '../services/cas.service';

const api = new UserAPI();

const logger = Logger.getLogger('UserReducer');

const getUser = (username: string) => {
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
    createUser: (_, { input }) => api.createUser(input),
    logout: (_, { token }) => invalidateToken(token),
    refreshToken: async (_, { token }) => {
      const obj = verifyToken<User>(token);

      const user = await getUser(obj.username);
      return issueToken(user.data?.user);
    },
    validateCasTicket: async (_, { ticket }) => {
      try {
        const username = await validateCasTicket(ticket);

        const exists = await api.userExists(username);

        if (exists) {
          throw new Error('CAS_USER_EXISTS');
        }

        logger.info(`CAS Register for new member: ${username}`);

        const hash = hashWithSecret(username);

        return { hash, username };
      } catch (err) {
        logger.error(`Cas validation failed ${err as string}`);
        throw Error(err);
      }
    },
    casCreateUser: (_, { input, hash }) => {
      // Verifierar att det är korrekt STIL-ID som används
      if (hashWithSecret(input.username) !== hash) {
        return null;
      }

      return api.createUser(input);
    },
  },
};

export default userResolver;
