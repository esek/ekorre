import DataLoader from 'dataloader';

/**
 * These are functions related to DataLoader and the
 * GraphQL (n+1) problem. To create a new kind of dataloader,
 * create a batch function and a create<Type>DataLoader() function.
 *
 * Why not simply have global DataLoader objects? Well they would quickly become
 * outdated, and it would result in caching data server-side which may quickly
 * be outdated. This is intended for batching, i.e. not having to query
 * for the same User multiple times.
 */

/**
 * Creates a new dataloader of type T
 * @param cb Callback function for handling dataloader requests
 * @returns Dataloader of type T
 */
export const createDataLoader = <T, K = string>(
  cb: (keys: readonly K[]) => Promise<ArrayLike<T | Error>>,
) => new DataLoader<K, T>(cb);
