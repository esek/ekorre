import TokenProvider, { hashWithSecret } from '@/auth';
import { useDataLoader } from '@/dataloaders';
import { BadRequestError, ServerError, UnauthenticatedError } from '@/errors/request.errors';
import { ApiKeyResponse } from '@/models/mappers';
import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated } from '@/util';
import { ApiKeyAPI } from '@api/apikey';
import { UserAPI } from '@api/user';
import { userApi } from '@dataloader/user';
import { LoginProvider } from '@esek/auth-server';
import { Feature, Resolvers, User } from '@generated/graphql';
import { apiKeyReducer } from '@reducer/apikey';
import { userReduce } from '@reducer/user';
import { validateCasTicket } from '@service/cas';

const api = new UserAPI();
const apiKeyApi = new ApiKeyAPI();

const authResolver: Resolvers = {
  ApiKey: {
    creator: async (key, _, ctx) => {
      // only superadmins can see the creator
      await hasAccess(ctx, Feature.Superadmin);

      return useDataLoader<ApiKeyResponse, string, User>((model) => {
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
    login: async (_, { username, password }) => {
      try {
        const user = await api.loginUser(username, password);

        const accessToken = TokenProvider.issueToken(username, 'access_token');
        const refreshToken = TokenProvider.issueToken(username, 'refresh_token');

        return {
          accessToken,
          refreshToken,
          user: reduce(user, userReduce),
        };
      } catch {
        throw new UnauthenticatedError('Inloggningen misslyckades');
      }
    },
    logout: (_, __, { bearerToken }) => {
      // Invalidate both access- and refreshtoken
      TokenProvider.invalidateTokens(bearerToken);

      return true;
    },
    issueTokens: async (_, { username }, ctx) => {
      await hasAccess(ctx, [Feature.UserAdmin]);

      // just try to get the user so that it throws if the username does not exist
      await api.getSingleUser(username);

      const accessToken = TokenProvider.issueToken(username, 'access_token');
      const refreshToken = TokenProvider.issueToken(username, 'refresh_token');

      return {
        accessToken,
        refreshToken,
      };
    },
    refresh: (_, { refreshToken }) => {
      const { username } = TokenProvider.verifyToken(refreshToken, 'refresh_token');

      const newAccessToken = TokenProvider.issueToken(username, 'access_token');
      const newRefreshToken = TokenProvider.issueToken(username, 'refresh_token');

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    },
    providerLogin: async (_, { input }) => {
      const { provider, token, email } = input;

      const user = await userApi.getUserFromProvider(token, provider, email ?? undefined);
      const accessToken = TokenProvider.issueToken(user.username, 'access_token');
      const refreshToken = TokenProvider.issueToken(user.username, 'refresh_token');

      return {
        user: reduce(user, userReduce),
        accessToken,
        refreshToken,
      };
    },
    linkLoginProvider: async (_, { input }, ctx) => {
      await hasAuthenticated(ctx);
      const username = ctx.getUsername();

      if (!Object.values(LoginProvider).includes(input.provider as LoginProvider)) {
        throw new BadRequestError('Denna providern finns inte');
      }

      const provider = userApi.linkLoginProvider(
        username,
        input.provider as LoginProvider,
        input.token,
        input.email ?? undefined,
      );

      return provider;
    },
    casLogin: async (_, { token }, { request }) => {
      const { referer } = request.headers;

      const username = await validateCasTicket(token, referer ?? '');

      if (!username) {
        throw new ServerError('Användaren kunde inte hittas');
      }

      // Catch not found user and return null
      const user = await api.getSingleUser(username).catch(() => null);

      const exists = user != null;

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
