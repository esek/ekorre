import { Response } from 'express';

import { UserAPI } from '../api/user.api';
import { COOKIES, EXPIRE_MINUTES, invalidateTokens, issueToken } from '../auth';
import { Resolvers } from '../graphql.generated';
import type { TokenType } from '../models/auth';
import { reduce } from '../reducers';
import { userReduce } from '../reducers/user.reducer';

const api = new UserAPI();

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
    secure: true,
    maxAge: EXPIRE_MINUTES[tokenType] * 60 * 1000,
  });
};

const authResolver: Resolvers = {
  Mutation: {
    login: async (_, { username, password }, { response }) => {
      const user = await api.loginUser(username, password);

      if (!user) {
        return null;
      }

      const refresh = issueToken({ username }, 'refreshToken');
      const access = issueToken({ username }, 'accessToken');

      // Attach a refresh token to the response object
      attachCookie(COOKIES.refreshToken, refresh, 'refreshToken', response);
      attachCookie(COOKIES.accessToken, access, 'accessToken', response);

      return reduce(user, userReduce);
    },
    logout: (_, __, { refreshToken, accessToken, response }) => {
      // Invalidate both access- and refreshtoken
      invalidateTokens(accessToken, refreshToken);
      return true;
    },
  },
};

export default authResolver;
