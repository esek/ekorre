import jwt from 'jsonwebtoken';

import { Logger } from './logger';

const SECRET = 'bigone';
const EXPIRE_HOURS = 2;
const EXPIRE_MS = EXPIRE_HOURS * 1000 * 60;
const logger = Logger.getLogger('Auth');
const invalidTokenStore: Set<string> = new Set();
let earliestToken = 0;

/**
 * Kollar ifall det finns en svartlistad token.
 * @param token - Den token som kollas
 * @returns Sant ifall den givna tokenen finns annars falskt.
 */
const checkTokenStore = (token: string): boolean => {
  if (Date.now() - earliestToken > EXPIRE_MS) {
    invalidTokenStore.clear();
    return false;
  }
  return invalidTokenStore.has(token);
};

/**
 * Verifiera inkommande token. Kommer kasta error ifall den är ogiltig!
 * Om tokenen är godkänd så kommer dess data att returneras.
 * @param token the jwt token
 * @returns JWT payload eller false ifall tokenen har blivit invaliderad.
 */
export const verifyToken = <T>(token: string): T | boolean => {
  if (checkTokenStore(token)) return false;
  const u = jwt.verify(token, SECRET);
  logger.debug(`Authorized a token with value: ${Logger.pretty(u)}`);
  return u as unknown as T; // Kan bli problem senare...
};

/**
 * Skapa en token till ett objekt
 * @param o - Ett objekt
 */
export const issueToken = (o: Record<string, unknown>): string => {
  const token = jwt.sign(o, SECRET, { expiresIn: `${EXPIRE_HOURS}h` });
  logger.debug(`Issued a token for object: ${Logger.pretty(o)}`);
  return token;
};

/**
 * Invalidera en token i lika lång tid som den är giltlig.
 * VARNING! Svarlistan är sparad i minnet och kommer förstöras
 * ifall servern startas om.
 * @param token - Den token som ska invalideras
 */
export const invalidateToken = (token: string): boolean => {
  if (invalidTokenStore.size === 0) {
    earliestToken = Date.now();
  }
  invalidTokenStore.add(token);
  logger.debug('Invalidated a token.');
  return true;
};
