import { Cookies, ETokenProvider } from '@esek/auth-server';
import { createHash } from 'crypto';

import config from './config';
import { CustomReq } from './models/context';

/**
 * Hashar en string tillsammans med dagens secret
 * @param s Stringen att hasha
 * @returns Hash
 */
export const hashWithSecret = (s: string) =>
  createHash('sha256')
    .update(s + config.JWT.SECRET)
    .digest('hex');

const tokenProvider = new ETokenProvider({
  cookieDomain: config.DEV ? 'localhost' : 'esek.se',
  secret: config.JWT.SECRET,
});

export const getBearerToken = (req: CustomReq) => {
  const header = () => req.headers?.authorization?.replace('Bearer ', '');
  const cookie = () => req.cookies?.[Cookies.access_token];

  return header() ?? cookie() ?? '';
};

export default tokenProvider;
