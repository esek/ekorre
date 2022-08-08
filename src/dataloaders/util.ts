import { NotFoundError } from '@/errors/request.errors';

/**
 * Goes through expected keys, sorts received values in same order as keys, and inserts
 * `NotFoundError` at the correct index if the expected key is not in the received values.
 * Will add what key failed (or if all did) to error message start
 * @param expectedKeys Keys that are expected to exist as a property in the values
 * @param comparisonProperty What property of the received values that should have key values
 * @param receivedValues The values received
 * @param errorMsg What error message the `NotFoundError`s should have
 */
export const sortBatchResult = <T extends K[keyof K], K>(
  expectedKeys: readonly T[],
  comparisonProperty: keyof K,
  receivedValues: Array<K>,
  errorMsg: string,
): ArrayLike<K | NotFoundError> => {
  // We have received no values, no need to sort
  if (receivedValues.length === 0) {
    return new Array<NotFoundError>(expectedKeys.length).fill(new NotFoundError(`For key ${String(comparisonProperty)} with values ${String(expectedKeys)} (all attempted): ${errorMsg}`));
  }

  // To get from O(n^2) to O(2n) we first map our values to their
  // own key values
  const mappedValues = new Map<K[keyof K], K>();
  receivedValues.forEach((v) => {
    mappedValues.set(v[comparisonProperty], v);
  });

  // Then we go through all expected keys. Since get is O(1),
  // we only really ever go through two arrays once each
  return expectedKeys.map((key) => {
    return mappedValues.get(key) || new NotFoundError(`For key ${String(comparisonProperty)} with value ${String(key)}: ${errorMsg}`);
  });
};
