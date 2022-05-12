import { AccessAPI } from '@api/access';
import { ApiKeyAPI } from '@api/apikey';
import { UserAPI } from '@api/user';
import { Feature, NewUser } from '@generated/graphql';
import { PrismaUser } from '@prisma/client';

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
 */
export const genRandomUser = (): [() => Promise<PrismaUser>, NOOP] => {
  // Fill set with seeded usernames to begin with
  const usedUsernames = new Set(['aa0000bb-s', 'bb1111cc-s', 'no0000oh-s']);
  
  const getRandString = (): string => Math.random().toString(36);
  
  /**
   * Generates a random username on format ccNNNNcc-s, but checks so that it doesn't already exist
   * Also reserves the username in the usedUsernames set
   */
  const getRandomUsername = (): string => {
    const getRandNumberString = (): string => String(Math.floor(Math.random() * (9999) + 9999)).padStart(4, '0');
    
    const attemptedUsername = `${getRandString().substring(0, 2)}${getRandNumberString()}${getRandString().substring(0, 2)}-s`;
    
    if (usedUsernames.has(attemptedUsername)) {
      // We try again
      return getRandomUsername();
    }
    usedUsernames.add(attemptedUsername);
    return attemptedUsername;
  };
  
  return ((): [() => Promise<PrismaUser>, NOOP] => {
    const ru: NewUser = {
      class: `${getRandString().substring(0, 1)}`,
      firstName: getRandString().substring(0, 7),
      lastName: getRandString().substring(0, 19),
      password: getRandString().substring(0, 38),
      username: getRandomUsername(),
    };

    /**
     * Creates a random user, returning the API response
     * @returns 
     */
    const create = async (): Promise<PrismaUser> => {
      try {
        return userApi.createUser(ru);
      } catch (err) {
        // If we against all odds have a double
        console.log('Attempt to create random user failed, trying again...');
        return create();
      }
    };

    const remove = async () => {
      await userApi.deleteUser(ru.username);
      usedUsernames.delete(ru.username);
    };

    return [create, remove];
  })();
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
    await userApi.clear();
  };

  return [create, remove];
};
