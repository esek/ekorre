import { AccessAPI } from '@api/access';
import { ApiKeyAPI } from '@api/apikey';
import { UserAPI } from '@api/user';
import { Feature, NewUser } from '@generated/graphql';

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
