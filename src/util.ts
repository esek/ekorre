import { StrictObject } from '@/models/base';
import { Feature } from '@generated/graphql';
import { ForbiddenError } from '@/errors/request.errors';
import { Context } from './models/context';
import config from './config';

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
export const stripObject = <E, T extends E>(obj: E): Partial<T> => {
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

/**
 * Checks if user has access to a feature
 * @param ctx Resolver context
 * @param requirement Array or single element of required permissions
 * @throws {ForbiddenError} if user does not have required permissions
 */
export const hasAccess = async (ctx: Context, requirement: Feature | Feature[]): Promise<void> => {
  if (config.SKIP_ACCESS_CHECKS) return;

  const req: Feature[] = [];

  if (!Array.isArray(requirement)) {
    req.push(requirement);
  }

  const {features} = await ctx.getAccess();

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
