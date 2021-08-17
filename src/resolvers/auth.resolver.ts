import { Response } from 'express';

import { UserAPI } from '../api/user.api';
import { COOKIES, invalidateToken, issueToken, verifyToken } from '../auth';
import { Resolvers } from '../graphql.generated';
import { reduce } from '../reducers';
import { userReduce } from '../reducers/user.reducer';

const api = new UserAPI();

const sendRefreshToken = (username: string, response: Response) => {
  const refreshToken = issueToken({ username }, 'refreshToken');
  response.cookie(COOKIES.refreshToken, refreshToken, {
    httpOnly: true,
    secure: true,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // Expires in 7d
  });
};

const authResolver: Resolvers = {
  Query: {
    refreshToken: async (_, _params, { response, refreshToken }) => {
      if (!refreshToken) {
        return null;
      }

      const { username } = verifyToken<{ username: string }>(refreshToken, 'refreshToken');

      if (!username) {
        return null;
      }

      const user = await api.getSingleUser(username);

      if (!user) {
        return null;
      }

      sendRefreshToken(user.username, response);

      const fullUser = reduce(user, userReduce);

      return {
        accessToken: issueToken(fullUser, 'accessToken'),
        user: fullUser,
      };
    },
  },
  Mutation: {
    login: async (_, { username, password }, { response }) => {
      const user = await api.loginUser(username, password);

      if (!user) {
        return false;
      }

      sendRefreshToken(user.username, response);

      return true;
    },
    logout: (_, { token }) => {
      if (!token) {
        return false;
      }

      invalidateToken(token);
      return true;
    },
  },
};

export default authResolver;
