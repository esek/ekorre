import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { Logger } from './logger';

let currentSecret: string;
let secretDate: Date;

/**
 * Generera en ny secret varje ny dag.
 */
const SECRET = () => {
  const now = new Date();
  if (currentSecret == null || secretDate.getDay() !== new Date().getDay()) {
    currentSecret = crypto.randomBytes(20).toString('hex');
    secretDate = now;
  }
  return currentSecret;
};
const EXPIRE_MINUTES = 10;
const logger = Logger.getLogger('Auth');
let invalidTokenStore: [token: string, time: number][] = [];

/**
 * Kollar ifall det finns en svartlistad token.
 * @param token - Den token som kollas
 * @returns Sant ifall den givna tokenen finns annars falskt.
 */
const checkTokenStore = (token: string): boolean => {
  const now = Date.now();
  invalidTokenStore = invalidTokenStore.filter(
    ([_, time]) => now - time < EXPIRE_MINUTES * 1000 * 60,
  );

  if (invalidTokenStore.find(([t]) => t === token) != null) {
    logger.log('Blacklisted token was used.');
    return true;
  }
  return false;
};

/**
 * Verifiera inkommande token. Kommer kasta error ifall den är ogiltig!
 * Om tokenen är godkänd så kommer dess data att returneras.
 * @param token the jwt token
 * @returns JWT payload eller eller Error ifall tokenen är invaliderad eller har annat fel.
 */
export const verifyToken = <T>(token: string): T => {
  if (checkTokenStore(token)) throw Error('JWT token is in blacklist!');
  const u = jwt.verify(token, SECRET());
  logger.debug(`Authorized a token with value: ${Logger.pretty(u)}`);
  return (u as unknown) as T; // Kan bli problem senare...
};

/**
 * Skapa en token till ett objekt
 * @param o - Ett objekt
 */
export const issueToken = (o: Record<string, unknown>): string => {
  const token = jwt.sign(o, SECRET(), { expiresIn: `${EXPIRE_MINUTES}min` });
  logger.debug(`Issued a token for object: ${Logger.pretty(o)}`);
  return token;
};

/**
 * Invalidera upp till 1000 tokens.
 * VARNING! Svarlistan är sparad i minnet och kommer förstöras
 * ifall servern startas om.
 * @param token - Den token som ska invalideras
 */
export const invalidateToken = (token: string): boolean => {
  invalidTokenStore.push([token, Date.now()]);
  logger.debug('Invalidated a token.');
  return true;
};
