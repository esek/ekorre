import { Response } from 'express';

import { UserAPI } from '../api/user.api';
import { COOKIES, invalidateToken, issueToken, verifyToken } from '../auth';
import { Resolvers } from '../graphql.generated';
import type { VerifiedRefreshToken } from '../models/auth';
import { reduce } from '../reducers';
import { userReduce } from '../reducers/user.reducer';

const api = new UserAPI();

/**
 * Helper to attach refresh token to the response object
 * @param {string} username The username to issue the token with
 * @param {Response} response Express response object to attach cookies to
 */
const attachRefreshToken = (username: string, response: Response) => {
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

      // Try to verify token and fetch the username from it
      const { username } = verifyToken<VerifiedRefreshToken>(refreshToken, 'refreshToken');

      // Fetch the entire user for that username
      const user = await api.getSingleUser(username);

      // If no user is found, return null
      if (!user) {
        return null;
      }

      // Attach a refresh token to the response object
      attachRefreshToken(user.username, response);

      // Reduce the user to get correct return type
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

      // Attach a refresh token to the response object
      attachRefreshToken(user.username, response);

      return true;
    },
    logout: (_, { token }, { refreshToken }) => {
      if (!token) {
        return false;
      }

      // Invalidate both access- and refreshtoken
      invalidateToken(token);
      invalidateToken(refreshToken);

      return true;
    },
  },
};

export default authResolver;
