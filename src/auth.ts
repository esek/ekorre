import jwt from 'jsonwebtoken';

import { Logger } from './logger';

const SECRET = 'bigone';
const EXPIRE = '2h';
const logger = Logger.getLogger('Auth');

/**
 * Verifiera inkommande token. Kommer kasta error ifall den är ogiltig!
 * Om tokenen är godkänd så kommer dess data att returneras.
 * @param token the jwt token
 */
const verifyToken = (token: string): unknown => {
  const u = jwt.verify(token, SECRET);
  logger.debug(`Authorized a token with value: ${Logger.pretty(u)}`);
  return u;
};

const issueToken = (o: Record<string, unknown>): string => {
  const token = jwt.sign(o, SECRET, { expiresIn: EXPIRE });
  logger.debug(`Issued a token for object: ${Logger.pretty(o)}`);
  return token;
};

export default {
  issueToken,
  verifyToken,
};
