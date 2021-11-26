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
  const testDummy: ValueType = value;
  return true;
};
