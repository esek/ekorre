import { Response } from 'express';

import { UserAPI } from '../api/user.api';
import { COOKIES, EXPIRE_MINUTES, invalidateToken, issueToken, verifyToken } from '../auth';
import { Resolvers } from '../graphql.generated';
import type { TokenType, TokenValue, VerifiedRefreshToken } from '../models/auth';
import { reduce } from '../reducers';
import { userReduce } from '../reducers/user.reducer';

const api = new UserAPI();

const baseCookie = {
  httpOnly: true,
  secure: true,
};

/**
 * Helper to attach refresh token to the response object
 * @param {string} username The username to issue the token with
 * @param {string} cookieName Name of cookie to set
 * @param {Response} response Express response object to attach cookies to
 */
const attachCookie = (
  cookieName: string,
  value: unknown,
  tokenType: TokenType,
  response: Response,
) => {
  response.cookie(cookieName, value, {
    httpOnly: true,
    secure: false,
    expires: new Date(Date.now() + EXPIRE_MINUTES[tokenType] * 1000 * 60),
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

      const access = issueToken<TokenValue>({ username }, 'accessToken');
      const refresh = issueToken({ username }, 'refreshToken');

      attachCookie(COOKIES.accessToken, access, 'accessToken', response);
      attachCookie(COOKIES.refreshToken, refresh, 'refreshToken', response);

      return reduce(user, userReduce);
    },
  },
  Mutation: {
    login: async (_, { username, password }, { response }) => {
      const user = await api.loginUser(username, password);

      if (!user) {
        return false;
      }

      const refresh = issueToken({ username }, 'refreshToken');

      // Attach a refresh token to the response object
      attachCookie(COOKIES.refreshToken, refresh, 'refreshToken', response);

      return true;
    },
    logout: (_, {}, { refreshToken, accessToken, response }) => {
      // Invalidate both access- and refreshtoken
      invalidateToken(accessToken);
      invalidateToken(refreshToken);

      return true;
    },
  },
};

export default authResolver;
