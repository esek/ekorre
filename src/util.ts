import { ForbiddenError, ServerError } from '@/errors/request.errors';
import { StrictObject } from '@/models/base';
import { Feature } from '@generated/graphql';

import config from './config';
import { Context } from './models/context';

/**
 * Converts a date to UTC format
 * @param d Date to convert
 * @returns A new Date object in UTC format
 */
export const toUTC = (d: Date) =>
  new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
    ),
  );

/**
 * Returns timestamp of exactly before or after midnight
 * (i.e. 23:59:59.999 or 00:00:00.000) the same day as `d`
 * @param d Date to convert to timestamp
 * @param when Either right `'before'` or `'right'` after midnight
 */
export const midnightTimestamp = (d: Date, when: 'before' | 'after'): number => {
  if (when === 'after') {
    return d.setHours(0, 0, 0, 0); // 00:00:00.000
  }
  return d.setHours(23, 59, 59, 999); // 23:59:59.999
};

/**
 * Removes unused keys from an object. Is needed before some
 * knex operations with `obj`
 * @param obj
 */
export const stripObject = <E extends StrictObject, T extends E>(obj: E): Partial<T> => {
  // Ts låter en inte indexera nycklar i params med foreach,
  // måste använda `StrictObject`
  const copy: StrictObject = { ...obj };
  Object.keys(copy).forEach((key) => (copy[key] === undefined ? delete copy[key] : {}));

  return copy as Partial<T>;
};

/**
 * Filter callback function for removing empty (Maybe<>) while maintaining
 * type safety.
 * @param value
 * @example
 * const someArray: Maybe<string>[] = // ...
 * // ...
 * const safeArray: string[] = someArray.filter(notEmpty);
 */
export const notEmpty = <ValueType>(value: ValueType | null | undefined): value is ValueType => {
  if (value === null || value === undefined) return false;
  return true;
};

// TODO: Remove if unused (was used by PostAPI)
export const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/[ö]/g, 'o')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

/**
 * Fetches the last number from a string, ex: `article-with-long-123-slug-7`, gives `7`
 * (last part of slug is ID)
 */
export const parseSlug = (slug: string): number | undefined => {
  let dbId: number;
  const regex = RegExp(/(\d+)[^-]*$/).exec(slug);

  if (regex?.length) {
    const [match] = regex;
    dbId = Number.parseInt(match, 10);
    return dbId;
  }

  return undefined;
};

/**
 * Checks if user has access to a feature
 * @param ctx Resolver context
 * @param requirement Array or single element of required permissions
 * @throws {ForbiddenError} if user does not have required permissions
 */
export const hasAccess = async (ctx: Context, requirement: Feature | Feature[]): Promise<void> => {
  if (config.SKIP_ACCESS_CHECKS) return;

  const req = Array.isArray(requirement) ? requirement : [requirement];

  const { features } = await ctx.getAccess();

  if (features.includes(Feature.Superadmin)) {
    return;
  }

  if (features.some((f) => req.includes(f))) {
    return;
  }

  throw new ForbiddenError('Aja baja det får du inte göra!');
};

/**
 * Checks if the user is authenticated otherwise throws an error
 * @param ctx Resolver context
 * @throws {UnauthenticatedError} If the user is not authenticated
 */
export const hasAuthenticated = async (ctx: Context): Promise<void> => {
  await ctx.getAccess();
};

/**
 * Raises a `ServerError` if called in production. To be used in dangerous
 * dev utils.
 *
 * @param message Message to use in `ServerError`
 * @throws {ServerError} If used in production
 */
export const devGuard = (message = 'Cannot do that in production'): void => {
  if (!config.DEV) {
    throw new ServerError(message);
  }
};

// Number of bytes in a megabyte
export const BYTES_PER_MB = 1e6;
