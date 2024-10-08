import { hashWithSecret } from '@/auth';
import { BadRequestError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import { Context } from '@/models/context';
import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated, stripObject } from '@/util';
import { PostAPI } from '@api/post';
import { UserAPI } from '@api/user';
import { userApi } from '@dataloader/user';
import { Feature, Resolvers, User } from '@generated/graphql';
import { userReduce } from '@reducer/user';
import { sendEmail } from '@service/email';
import EWiki from '@service/wiki';

const api = new UserAPI();
const wiki = new EWiki();
const postApi = new PostAPI();

const logger = Logger.getLogger('UserResolver');

const sendWelcomeEmail = async (email: string, firstname: string): Promise<void> => {
  try {
    await sendEmail(email, 'Välkommen till E-Sektionen', 'welcome', {
      firstName: firstname,
      loginLink: 'https://esek.se/auth/log-in',
      userEmail: email,
    });
  } catch (err) {
    logger.error('Failed to send email to new user');
    logger.error(err);
  }
};

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
  // According to privacy policy as of 2022-08-10, we can share
  // username, full name and class
  User: {
    // username, firstName and lastName needs no special handling
    fullName: ({ firstName, lastName }) => `${firstName} ${lastName}`,
    // photoUrl is OK
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
    luCard: async (obj, _, ctx) => {
      await checkUserFieldAccess(ctx, obj);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return obj.luCard!;
    },
    // website OK
    class: ({ firstName, class: className }) => {
      // hide phøsets class
      if (/ph[øö]s$/.test(firstName.toLowerCase().split(' ')[0])) {
        return 'XXXX';
      }

      return className;
    },
    wikiEdits: async ({ username }, _, ctx) => {
      await hasAuthenticated(ctx);

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
    verified: async ({ username }, _, ctx) => {
      await hasAuthenticated(ctx);

      if (!username) {
        return false;
      }

      const [verified, posts] = await Promise.all([
        api.isUserVerified(username),
        postApi.getPostsForUser(username, false),
      ]);

      //Treated as verified if you have a post
      return verified || posts.length > 0;
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
    users: async (_, { usernames }, ctx) => {
      await hasAuthenticated(ctx);
      const usernamesLowerCase = usernames.map((username) => username.toLowerCase());
      const users = await ctx.userDataLoader.loadMany(usernamesLowerCase);
      return users as User[]; // Error handling is done in user.dataloader.ts
    },
    userByCard: async (_, { luCard }, ctx) => {
      await hasAuthenticated(ctx);
      const u = await api.getSingleUserByLuCard(luCard);
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
    numberOfMembers: async (_, { noAlumni }) => api.getNumberOfMembers(noAlumni === true),
    usersWithIndividualAccess: async (_, __, ctx: Context) => {
      await hasAuthenticated(ctx);
      const users = await api.getUsersWithIndividualAccess();
      return reduce(users, userReduce);
    },
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

      await sendWelcomeEmail(user.email, user.firstName);

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

      await sendWelcomeEmail(created.email, created.firstName);

      return reduce(created, userReduce);
    },
    changePassword: async (_, { oldPassword, newPassword }, { getUsername }) => {
      const username = getUsername();

      const updated = await api.changePassword(username, oldPassword, newPassword);

      return updated;
    },
    forgetUser: async (_, { username }, ctx) => {
      const requester = ctx.getUsername();

      if (username !== requester) {
        await hasAccess(ctx, Feature.UserAdmin);
      }

      await api.forgetUser(username);

      const res = await api.getSingleUser(username);
      return userReduce(res);
    },
    verifyUser: async (_, { username, ssn }) => {
      const success = await api.verifyUser(username, ssn);
      return success;
    },
  },
};

export default userResolver;
