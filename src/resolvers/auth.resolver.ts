import { hashWithSecret } from '@/auth';
import { useDataLoader } from '@/dataloaders';
import { ServerError, UnauthenticatedError } from '@/errors/request.errors';
import { ApiKeyResponse } from '@/models/mappers';
import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated } from '@/util';
import { ApiKeyAPI } from '@api/apikey';
import { UserAPI } from '@api/user';
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
    loginProviders: async (_, __, ctx) => {
      await hasAuthenticated(ctx);

      const providers = await api.getLoginProviders(ctx.getUsername());
      return providers;
    },
  },
  Mutation: {
    login: async (_, { username, password }, { tokenProvider }) => {
      try {
        const user = await api.loginUser(username, password);

        const accessToken = tokenProvider.issueToken(user.username, 'access_token');
        const refreshToken = tokenProvider.issueToken(user.username, 'refresh_token');

        return {
          accessToken,
          refreshToken,
          user: reduce(user, userReduce),
        };
      } catch {
        throw new UnauthenticatedError('Inloggningen misslyckades');
      }
    },
    logout: (_, __, { refreshToken, accessToken, tokenProvider }) => {
      // Invalidate both access- and refreshtoken
      tokenProvider.invalidateTokens(accessToken, refreshToken);

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
    providerLogin: async (_, { options }, { response }) => {
      const user = await api.loginWithProvider(options);
      return reduce(user, userReduce);
    },
    linkProvider: async (_, { username, password, options }, { response }) => {
      // try to log in (so we verify the user)
      const user = await api.loginUser(username, password);
      const linked = await api.linkLoginProvider(user.username, options);
      return linked;
    },
    unlinkProvider: async (_, { linkId }, ctx) => {
      await hasAuthenticated(ctx);
      const unlinked = await api.unlinkLoginProvider(linkId);
      return unlinked;
    },
  },
};

export default authResolver;
