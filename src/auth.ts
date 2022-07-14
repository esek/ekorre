import { ETokenProvider } from '@esek/auth-server';
import { createHash } from 'node:crypto';

const secret = 'abc 123';

export const tokenProvider = new ETokenProvider({ cookieDomain: 'esek.se', secret });

/**
 * Hashar en string tillsammans med dagens secret
 * @param s Stringen att hasha
 * @returns Hash
 */
export const hashWithSecret = (s: string) =>
  createHash('sha256')
    .update(s + secret)
    .digest('hex');
