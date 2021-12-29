import { NotFoundError } from '../errors/RequestErrors';

/**
 * Goes through expected keys, sorts received values in same order as keys, and inserts
 * `NotFoundError` at the correct index if the expected key is not in the received values.
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
    return new Array<NotFoundError>(expectedKeys.length).fill(new NotFoundError(errorMsg));
  }

  return expectedKeys.map((key) => {
    // This may be O(n^2), but still better than reading multiple times from disk (hopefully...)
    return receivedValues.find(value => value[comparisonProperty] === key) || new NotFoundError(errorMsg);
  });
};
