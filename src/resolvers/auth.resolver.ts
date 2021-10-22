import { Response } from 'express';

import { UserAPI } from '../api/user.api';
import { COOKIES, EXPIRE_MINUTES, hashWithSecret, issueToken } from '../auth';
import { Resolvers } from '../graphql.generated';
import type { TokenType } from '../models/auth';
import { reduce } from '../reducers';
import { userReduce } from '../reducers/user.reducer';
import { validateCasTicket } from '../services/cas.service';

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
    sameSite: 'none',
    maxAge: EXPIRE_MINUTES[tokenType] * 1000 * 60,
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
    logout: (_, __, { refreshToken, accessToken }) => {
      // Invalidate both access- and refreshtoken
      invalidateTokens(accessToken, refreshToken);
      return true;
    },
    casLogin: async (_, { token }, { request, response }) => {
      const referer = request.headers.referer;

      const username = await validateCasTicket(token, referer ?? '');

      if (!username) {
        throw new Error();
      }

      const user = await api.getSingleUser(username);

      let exists = user != null;

      if (exists) {
        const refresh = issueToken({ username }, 'refreshToken');
        // Attach a refresh token to the response object
        attachCookie(COOKIES.refreshToken, refresh, 'refreshToken', response);
      }

      const hash = hashWithSecret(username);

      return {
        username,
        hash,
        exists,
      };
    },
  },
};

export default authResolver;
