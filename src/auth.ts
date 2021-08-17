import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

import { Logger } from './logger';
import type { SecretStore, TokenBlacklistItem, TokenType } from './models/auth';

const logger = Logger.getLogger('Auth');

const secrets: SecretStore = {
  accessToken: {
    value: '',
    time: Date.now(),
    refreshDays: 1,
  },
  refreshToken: {
    value: '',
    time: Date.now(),
    refreshDays: 30,
  },
};

let tokenBlacklist: TokenBlacklistItem[] = [];

const EXPIRE_MINUTES: Record<TokenType, number> = {
  accessToken: 60, // 60min
  refreshToken: 60 * 24 * 15, // 15d
};

export const COOKIES: Record<TokenType, string> = {
  accessToken: 'e-access-token',
  refreshToken: 'e-refresh-token',
};

/**
 * Generera en ny secret om det behövs
 */
const SECRET = (type: TokenType) => {
  const now = Date.now();
  const { value, time, refreshDays } = secrets[type];

  const inRange = now - time < refreshDays * 24 * 60 * 60 * 1000;

  if (!value || !inRange) {
    secrets[type].value = randomBytes(20).toString('hex');
    secrets[type].time = now;
  }

  return secrets[type].value;
};

/**
 * Skapa en token till ett objekt
 * @param obj - Objektet som ska finnas i token
 * @param type - Typen av token som skapas
 */

export const issueToken = <T extends Record<string, unknown>>(obj: T, type: TokenType): string => {
  const token = jwt.sign(obj, SECRET(type), { expiresIn: `${EXPIRE_MINUTES[type]}min` });

  logger.debug(`Issued a ${type} for object: ${Logger.pretty(obj)}`);

  return token;
};

/**
 * Kollar ifall det finns en svartlistad token.
 * @param token - Den token som kollas
 * @returns Sant ifall den givna tokenen finns annars falskt.
 */
const isBlackListed = (token: string, type: TokenType): boolean => {
  const now = Date.now();

  tokenBlacklist = tokenBlacklist.filter(
    ({ time, token }) => token && now - time < EXPIRE_MINUTES[type] * 1000 * 60,
  );

  if (tokenBlacklist.some(({ token: blacklistedToken }) => blacklistedToken === token)) {
    logger.warn('Blacklisted token was used.');
    return true;
  }

  return false;
};

/**
 * Verifiera inkommande token. Kommer kasta error ifall den är ogiltig!
 * Om tokenen är godkänd så kommer dess data att returneras.
 * @param token jwt token
 * @param type typen av token, antingen `accessToken` eller `refreshToken`
 * @returns JWT payload eller eller Error ifall tokenen är invaliderad eller har annat fel.
 */
export const verifyToken = <T>(token: string, type: TokenType) => {
  if (isBlackListed(token, type)) {
    throw new Error('This token is no longer valid');
  }

  const obj = jwt.verify(token, SECRET(type));

  logger.debug(`Verified a ${type} with value: ${Logger.pretty(obj)}`);

  return (obj as unknown) as T;
};

/**
 * Invalidera upp till 1000 tokens.
 * VARNING! Svarlistan är sparad i minnet och kommer förstöras
 * ifall servern startas om.
 * @param token - Den token som ska invalideras
 */
export const invalidateToken = (token: string): void => {
  tokenBlacklist.push({ token, time: Date.now() });
  logger.debug(`Token ${token} was invalidated`);
};
