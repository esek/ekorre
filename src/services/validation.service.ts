import { NotFoundError } from '../errors/RequestErrors';

/**
 * Checks if an array is empty and throws a NotFoundError if it is
 * @param {Array} arr The array to check
 * @param {string} errorMsg The message to pass to the error
 * @throws {NotFoundError} A 404 error indicating that nothing was found
 */

export const validateNonEmptyArray = (arr: unknown[], errorMsg: string): void => {
  if (!arr?.length) {
    throw new NotFoundError(errorMsg ?? 'Något gick fel');
  }
};
