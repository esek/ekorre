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
