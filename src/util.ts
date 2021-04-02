/* eslint-disable import/prefer-default-export */

/**
 * Utility function to ensure that the required modules
 * are supplied in the config.
 */
export const dependecyGuard = (name: string, dependecies: string[]): void => {
  const modules = JSON.parse(process.env.MODULES ?? '[]') as string[];
  if (!dependecies.every((e) => modules.includes(e)))
    throw new Error(`Module(s) ${dependecies.join(' ')} is required by ${name}!`);
};

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
