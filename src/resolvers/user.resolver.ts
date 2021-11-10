import { UserAPI } from '../api/user.api';
import { verifyToken } from '../auth';
import { userApi } from '../dataloaders/user.dataloader';
import type { Resolvers } from '../graphql.generated';
import { TokenValue } from '../models/auth';
import { reduce } from '../reducers';
import { userReduce } from '../reducers/user.reducer';
import { sendEmail } from '../services/email.service';
import { stripObject } from '../util';

const api = new UserAPI();

const userResolver: Resolvers = {
  Query: {
    me: async (_, __, { accessToken, refreshToken }) => {
      const access = verifyToken<TokenValue>(accessToken, 'accessToken');
      const refresh = verifyToken<TokenValue>(refreshToken, 'refreshToken');

      const accessExpiry = access.exp * 1000;
      const refreshExpiry = refresh.exp * 1000;

      const user = await userApi.getSingleUser(access.username);

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
  },
  Mutation: {
    updateUser: async (_, { input }, ctx) => {
      const user = ctx.getUser();

      await api.updateUser(user.username, stripObject(input));

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
  },
};

export default userResolver;
