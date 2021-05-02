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
