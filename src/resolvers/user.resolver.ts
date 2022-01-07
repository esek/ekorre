import { UserAPI } from '../api/user.api';
import { hashWithSecret, verifyToken } from '../auth';
import { BadRequestError } from '../errors/RequestErrors';
import type { Resolvers } from '../graphql.generated';
import { TokenValue } from '../models/auth';
import { reduce } from '../reducers';
import { userReduce } from '../reducers/user.reducer';
import { sendEmail } from '../services/email.service';
import EWiki from '../services/wiki.service';
import { stripObject } from '../util';

const api = new UserAPI();
const wiki = new EWiki();

const userResolver: Resolvers = {
  User: {
    wikiEdits: async ({ username }) => {
      if (!username) {
        return 0;
      }

      const edits = await wiki.getNbrOfUserEdits(username);
      return edits;
    },
  },
  Query: {
    me: async (_, __, { accessToken, refreshToken }) => {
      const access = verifyToken<TokenValue>(accessToken, 'accessToken');
      const refresh = verifyToken<TokenValue>(refreshToken, 'refreshToken');

      const accessExpiry = access.exp * 1000;
      const refreshExpiry = refresh.exp * 1000;

      const user = await api.getSingleUser(access.username);

      if (!user) {
        return {
          accessExpiry,
          refreshExpiry,
        };
      }

      const reduced = reduce(user, userReduce);

      return {
        user: reduced,
        accessExpiry: access.exp * 1000,
        refreshExpiry: refresh.exp * 1000,
      };
    },
    user: async (_, { username }) => {
      const u = await api.getSingleUser(username);
      return reduce(u, userReduce);
    },
    searchUser: async (_, { search }) => {
      // If no search query
      if (!search) {
        throw new BadRequestError('Du måste ange en söksträng');
      }

      const users = await api.searchUser(search);
      return reduce(users, userReduce);
    },
  },
  Mutation: {
    updateUser: async (_, { input }, { getUsername }) => {
      const username = getUsername();
      await api.updateUser(username, stripObject(input));

      return true;
    },
    createUser: async (_, { input }) => {
      await api.createUser(input);

      return true;
    },
    requestPasswordReset: async (_, { username }) => {
      const user = await api.getSingleUser(username);

      if (!user) {
        return false;
      }

      const token = await api.requestPasswordReset(user.username);

      if (!token) {
        return false;
      }

      await sendEmail(user.email, 'Glömt lösenord?', 'forgot-password', {
        firstName: user.firstName,
        resetLink: `https://esek.se/account/forgot-password?token=${token}&username=${user.username}`,
        contactEmail: 'macapar@esek.se',
        userEmail: user.email,
      });

      return true;
    },
    validatePasswordResetToken: async (_, { username, token }) =>
      api.validateResetPasswordToken(username, token),
    resetPassword: async (_, { token, username, password }) => {
      await api.resetPassword(token, username, password);
      return true;
    },
    casCreateUser: async (_, { input, hash }) => {
      // Check that hash is ok
      if (hashWithSecret(input.username) !== hash) {
        return false;
      }

      const created = await api.createUser(input);

      return created != null;
    },
  },
};

export default userResolver;
