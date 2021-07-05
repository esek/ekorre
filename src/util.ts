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

export const stripObject = <E, T extends E>(obj: E): Partial<T> => {
  const update: Partial<T> = {};

  (Object.keys(obj) as (keyof E)[]).forEach((k) => {
    (update as Record<keyof E, unknown>)[k] = obj[k] ?? undefined;
  });

  return update;
};
