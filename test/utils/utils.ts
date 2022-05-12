import { AccessAPI } from '@api/access';
import { ApiKeyAPI } from '@api/apikey';
import { UserAPI } from '@api/user';
import { postApi } from '@dataloader/post';
import { Feature, NewPost, NewUser, PostType, Utskott } from '@generated/graphql';
import { prisma, PrismaPost, PrismaUser } from '@prisma/client';

/**
 * Extrahera en token ur en set-cookie-sträng, eller returnera
 * `null` om ingen hittas
 * @param s `set-cookie`-string
 */
export const extractToken = (tokenName: string, s?: string): string | null => {
  if (!s) {
    return null;
  }

  // Matcha base64url enl. JavaScript-specification, inclusive
  // separator "."
  const match = RegExp(`(?<=${tokenName}=)([-_.A-z0-9]+);`).exec(s);
  if (match !== null) {
    return match[0];
  }
  return null;
};

const usedUsernames = new Set(['aa0000bb-s', 'bb1111cc-s', 'no0000oh-s']);
const usedPostnames = new Set(['Macapär', 'Teknokrat', 'Cophøs']);

// Fult men eneklt att förstå
const stringGenerator = (len: number) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < len; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generates a random username on format ccNNNNcc-s, but checks so that it doesn't already exist
 * Also reserves the username in the usedUsernames set
 */
export const getRandomUsername = (): string => {
  const firstPart = stringGenerator(2);
  const numberPart = Math.floor(1000 + Math.random() * 9000);
  const lastPart = stringGenerator(2);

  const attemptedUsername = `${firstPart}${numberPart}${lastPart}-s`;
  if (usedUsernames.has(attemptedUsername)) {
    return getRandomUsername();
  }

  usedUsernames.add(attemptedUsername);
  return attemptedUsername;
};

type NOOP<T = void> = () => Promise<T>;
const userApi = new UserAPI();
const apiKeyApi = new ApiKeyAPI();
const accessApi = new AccessAPI();

export const genUserWithAccess = (userInfo: NewUser, access: Feature[]): [NOOP, NOOP] => {
  const create = async () => {
    await userApi.createUser(userInfo);
    await accessApi.setIndividualAccess(userInfo.username, { features: access, doors: [] });
  };

  const remove = async () => {
    await userApi.deleteUser(userInfo.username);
  };

  return [create, remove];
};

/**
 * Generates a new user with random username, name etc.
 * Usernames are memoized so doubles are avoided
 *
 * Jag ville göra detta till en klass men Blennow o Foobar klagade --Emil
 */
export const genRandomUser = (access: Feature[]): [() => Promise<PrismaUser>, NOOP] => {
  const ru: NewUser = {
    class: `${stringGenerator(1)}19`,
    firstName: stringGenerator(4),
    lastName: stringGenerator(11),
    password: stringGenerator(11),
    username: getRandomUsername(),
  };

  /**
   * Creates a random user, returning the API response
   * @returns
   */
  const create = async (): Promise<PrismaUser> => {
    let createdUser;
    try {
      createdUser = await userApi.createUser(ru);
    } catch (err) {
      // If we against all odds have a double
      console.log('Attempt to create random user failed, trying again...');
      return create();
    }
    await accessApi.setIndividualAccess(createdUser.username, { features: access, doors: [] });
    return createdUser;
  };

  const remove = async () => {
    await userApi.deleteUser(ru.username);
    usedUsernames.delete(ru.username);
  };

  return [create, remove];
};

export const genRandomPost = (): [() => Promise<number>, NOOP] => {
  const possiblePostTypes = [PostType.Ea, PostType.ExactN, PostType.N, PostType.U];
  const possibleUtskott = [
    Utskott.Cm,
    Utskott.E6,
    Utskott.Enu,
    Utskott.Fvu,
    Utskott.Infu,
    Utskott.Km,
    Utskott.Noju,
    Utskott.Nollu,
    Utskott.Other,
    Utskott.Sre,
    Utskott.Styrelsen,
  ];

  const rp: NewPost = {
    name: stringGenerator(Math.floor(Math.random() * (20 - 5) - 5)),
    postType: possiblePostTypes[Math.floor(Math.random() * possiblePostTypes.length)],
    utskott: possibleUtskott[Math.floor(Math.random() * possibleUtskott.length)],
  };

  let createdPostId: number;

  const create = async (): Promise<number> => {
    try {
      createdPostId = await postApi.createPost(rp);
    } catch (err) {
      // If we against all odds have a double
      console.log('Attempt to create random post failed, trying again...');
      return create();
    }
    return createdPostId;
  };

  const remove = async () => {
    await postApi.deletePost(createdPostId ?? -1);
    usedPostnames.delete(rp.name);
  };

  return [create, remove];
};

export const genApiKey = (
  userInfo: NewUser,
  access: Feature[],
  createNewUser = true,
): [NOOP<string>, NOOP] => {
  let apikey: string;
  const create = async () => {
    if (createNewUser) {
      await userApi.createUser(userInfo);
    }
    apikey = await apiKeyApi.createApiKey('Test API key', userInfo.username);
    await accessApi.setApiKeyAccess(apikey, { features: access, doors: [] });

    return apikey;
  };

  const remove = async () => {
    await apiKeyApi.removeApiKey(apikey);
    await userApi.deleteUser(userInfo.username);
  };

  return [create, remove];
};
