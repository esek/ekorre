import { hashWithSecret } from '@/auth';
import { BadRequestError } from '@/errors/request.errors';
import { Context } from '@/models/context';
import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated, stripObject } from '@/util';
import { UserAPI } from '@api/user';
import { userApi } from '@dataloader/user';
import { Feature, Resolvers, User } from '@generated/graphql';
import { userReduce } from '@reducer/user';
import { sendEmail } from '@service/email';
import EWiki from '@service/wiki';

const api = new UserAPI();
const wiki = new EWiki();

/**
 * Ensures the requester is the `User` requested,
 * and if not, that the requester is a User Admin
 * @param ctx Context containing information about the user or API key making the request
 * @param obj The requested object
 * @throws {ForbiddenError} if the requester is not allowed to view this
 */
export const checkUserFieldAccess = async (ctx: Context, obj: User) => {
  if (ctx.apiKey) {
    await hasAccess(ctx, [Feature.UserAdmin]);
    return;
  }

  if (ctx.getUsername() !== obj.username) {
    await hasAccess(ctx, Feature.UserAdmin);
  }
};

const userResolver: Resolvers = {
  // To hide user fields from the public, add fields here with auth
  User: {
    fullName: ({ firstName, lastName }) => `${firstName} ${lastName}`,
    email: async (obj, _, ctx) => {
      // Don't want to leak contact details to the public
      await hasAuthenticated(ctx);

      return obj.email;
    },
    phone: async (obj, _, ctx) => {
      // Don't want to leak contact details to the public
      await hasAuthenticated(ctx);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return obj.phone!;
    },
    address: async (obj, _, ctx) => {
      await checkUserFieldAccess(ctx, obj);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return obj.address!;
    },
    zipCode: async (obj, _, ctx) => {
      await checkUserFieldAccess(ctx, obj);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return obj.zipCode!;
    },
    wikiEdits: async ({ username }) => {
      if (!username) {
        return 0;
      }

      const edits = await wiki.getNbrOfUserEdits(username);
      return edits;
    },
    loginProviders: async (obj, _, ctx) => {
      await checkUserFieldAccess(ctx, obj);

      const providers = await userApi.getLoginProviders(obj.username);

      return providers;
    },
    class: async ({ firstName, class: className }) => {
      // hide phøsets class
      if (firstName.toLowerCase().match(/ph[øö]s$/)) {
        return 'XXXX';
      }

      return className;
    },
  },
  Query: {
    me: async (_, __, { getUsername }) => {
      const user = await api.getSingleUser(getUsername());
      return reduce(user, userReduce);
    },
    user: async (_, { username }, ctx) => {
      await hasAuthenticated(ctx);
      const u = await api.getSingleUser(username);
      return reduce(u, userReduce);
    },
    searchUser: async (_, { search }, ctx) => {
      await hasAuthenticated(ctx);
      // If no search query
      if (!search) {
        throw new BadRequestError('Du måste ange en söksträng');
      }

      const users = await api.searchUser(search);
      return reduce(users, userReduce);
    },
    numberOfMembers: async () => api.getNumberOfMembers(),
  },
  Mutation: {
    updateUser: async (_, { input }, { getUsername }) => {
      const username = getUsername();
      const updatedUser = await api.updateUser(username, stripObject(input));

      return reduce(updatedUser, userReduce);
    },
    createUser: async (_, { input }, ctx) => {
      await hasAccess(ctx, Feature.UserAdmin);
      const user = await api.createUser(input);

      return reduce(user, userReduce);
    },
    requestPasswordReset: async (_, { username, resetLink, returnTo }) => {
      const user = await api.getSingleUser(username);

      if (!user) {
        return false;
      }

      const token = await api.requestPasswordReset(user.username);

      if (!token) {
        return false;
      }

      const params = new URLSearchParams({
        token,
        username: user.username,
      });

      if (returnTo) {
        params.append('return_to', returnTo);
      }

      await sendEmail(user.email, 'Glömt lösenord?', 'forgot-password', {
        firstName: user.firstName,
        resetLink: `${resetLink}?${params.toString()}`,
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
        throw new BadRequestError('Kunde inte skapa användare');
      }

      const created = await api.createUser(input);

      return reduce(created, userReduce);
    },
  },
};

export default userResolver;
