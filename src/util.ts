import { StrictObject } from './models/base';

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
 * (i.e. 23:59:59:999 or 00:00:00:000) the same day as `d`
 * @param d Date to convert to timestamp
 * @param when Either right `'before'` or `'right'` after midnight
 */
export const midnightTimestamp = (d: Date, when: 'before' | 'after') => {
  // Don't fucking ask about this voodoo, fucking JS dates --Emil E
  if (when === 'before') {
    return d.setHours(24, 59, 59, 999);
  }
  return d.setHours(1, 0, 0, 0);
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
