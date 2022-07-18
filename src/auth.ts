import { ETokenProvider } from '@esek/auth-server';
import { createHash } from 'crypto';

import config from './config';

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

export default tokenProvider;
