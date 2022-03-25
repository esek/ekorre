import { COOKIES, EXPIRE_MINUTES, hashWithSecret, invalidateTokens, issueToken } from '@/auth';
import config from '@/config';
import { useDataLoader } from '@/dataloaders';
import { ServerError, UnauthenticatedError } from '@/errors/request.errors';
import type { TokenType } from '@/models/auth';
import { ApiKeyResponse } from '@/models/mappers';
import { reduce } from '@/reducers';
import { hasAccess } from '@/util';
import ApiKeyAPI from '@api/apikey';
import { UserAPI } from '@api/user';
import { Feature, Resolvers, User } from '@generated/graphql';
import { apiKeyReducer } from '@reducer/apikey';
import { userReduce } from '@reducer/user';
import { validateCasTicket } from '@service/cas';
import { Response } from 'express';

const api = new UserAPI();
const apiKeyApi = new ApiKeyAPI();

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
  ApiKey: {
    creator: async (key, _, ctx) => {
      // only superadmins can see the creator
      await hasAccess(ctx, Feature.Superadmin);

      return useDataLoader<ApiKeyResponse, User>((model) => {
        return { dataLoader: ctx.userDataLoader, key: model.creator.username };
      })(key, _, ctx);
    },
  },
  Query: {
    apiKey: async (_, { key }, ctx) => {
      // if its the key that's calling it we want to be able to see the info
      if (ctx.apiKey !== key) {
        await hasAccess(ctx, Feature.Superadmin);
      }

      const dbKey = await apiKeyApi.getApiKey(key);

      return reduce(dbKey, apiKeyReducer);
    },
    apiKeys: async (_, __, ctx) => {
      await hasAccess(ctx, Feature.AccessAdmin);
      const dbKeys = await apiKeyApi.getApiKeys();

      return reduce(dbKeys, apiKeyReducer);
    },
  },
  Mutation: {
    login: async (_, { username, password }, { response }) => {
      try {
        const user = await api.loginUser(username, password);

        const refresh = issueToken({ username }, 'refreshToken');
        const access = issueToken({ username }, 'accessToken');

        // Attach a refresh token to the response object
        attachCookie(COOKIES.refreshToken, refresh, 'refreshToken', response);
        attachCookie(COOKIES.accessToken, access, 'accessToken', response);

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
    createApiKey: async (_, { description }, ctx) => {
      await hasAccess(ctx, Feature.Superadmin);
      const res = await apiKeyApi.createApiKey(description, ctx.getUsername());
      return res;
    },
    deleteApiKey: async (_, { key }, ctx) => {
      await hasAccess(ctx, Feature.Superadmin);
      const res = await apiKeyApi.removeApiKey(key);
      return res;
    },
  },
};

export default authResolver;
