import { COOKIES, EXPIRE_MINUTES, hashWithSecret, invalidateTokens, issueToken } from '@/auth';
import config from '@/config';
import { ServerError, UnauthenticatedError } from '@/errors/request.errors';
import type { TokenType } from '@/models/auth';
import { reduce } from '@/reducers';
import { UserAPI } from '@api/user';
import { Resolvers } from '@generated/graphql';
import { userReduce } from '@reducer/user';
import { validateCasTicket } from '@service/cas';
import { Response } from 'express';

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

const setCookies = (username: string, response: Response) => {
  const refresh = issueToken({ username }, 'refreshToken');
  const access = issueToken({ username }, 'accessToken');

  // Attach a refresh token to the response object
  attachCookie(COOKIES.refreshToken, refresh, 'refreshToken', response);
  attachCookie(COOKIES.accessToken, access, 'accessToken', response);
};

const authResolver: Resolvers = {
  Query: {
    loginProviders: async (_, __, { getUsername }) => {
      const providers = await api.getLoginProviders(getUsername());
      return providers;
    },
  },
  Mutation: {
    login: async (_, { username, password }, { response }) => {
      try {
        const user = await api.loginUser(username, password);

        setCookies(user.username, response);

        return reduce(user, userReduce);
      } catch {
        throw new UnauthenticatedError('Inloggningen misslyckades');
      }
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
        throw new ServerError('Användaren kunde inte hittas');
      }

      // Catch not found user and return null
      const user = await api.getSingleUser(username).catch(() => null);

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
    providerLogin: async (_, { options }, { response }) => {
      const user = await api.loginWithProvider(options);

      setCookies(user.username, response);

      return reduce(user, userReduce);
    },
    linkProvider: async (_, { username, password, options }, { response }) => {
      // try to log in (so we verify the user)
      const user = await api.loginUser(username, password);
      const linked = await api.linkLoginProvider(user.username, options);

      setCookies(username, response);

      return linked;
    },
    unlinkProvider: async (_, { linkId }) => {
      const unlinked = await api.unlinkLoginProvider(linkId);
      return unlinked;
    },
  },
};

export default authResolver;
