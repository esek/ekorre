import { Response } from 'express';

import { UserAPI } from '../api/user.api';
import { COOKIES, EXPIRE_MINUTES, hashWithSecret, invalidateTokens, issueToken } from '../auth';
import config from '../config';
import { Resolvers } from '../graphql.generated';
import type { TokenType } from '../models/auth';
import { reduce } from '../reducers';
import { userReduce } from '../reducers/user.reducer';
import { validateCasTicket } from '../services/cas.service';

const api = new UserAPI();
const { COOKIE } = config;

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
    domain: COOKIE.DOMAIN,
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
    logout: (_, __, { response, refreshToken, accessToken }) => {
      // Invalidate both access- and refreshtoken
      invalidateTokens(accessToken, refreshToken);

      // Send back empty tokens
      attachCookie(COOKIES.accessToken, '', 'accessToken', response);
      attachCookie(COOKIES.refreshToken, '', 'refreshToken', response);

      return true;
    },
    casLogin: async (_, { token }, { request, response }) => {
      const { referer } = request.headers;

      const username = await validateCasTicket(token, referer ?? '');

      if (!username) {
        throw new Error();
      }

      const user = await api.getSingleUser(username);

      const exists = user != null;

      if (exists) {
        const refresh = issueToken({ username }, 'refreshToken');
        // Attach a refresh token to the response object
        attachCookie(COOKIES.refreshToken, refresh, 'refreshToken', response);
      }

      // Create a hash so that the request can be validated later
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
