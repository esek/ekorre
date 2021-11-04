import DataLoader from 'dataloader';

import type { StrictObject } from '../models/base';
import { Context } from '../models/context';

type DataLoaderCallback<T, E> = (
  model: T,
  context: Context,
) => {
  key?: string;
  dataLoader: DataLoader<string, E>;
};

/**
 * Creates a new dataloader of type T
 * @param cb Callback function for handling dataloader requests
 * @returns Dataloader of type T
 */
export const createDataLoader = <T, K = string>(
  cb: (keys: readonly K[]) => Promise<ArrayLike<T | Error>>,
) => new DataLoader<K, T>(cb);

/**
 * Generic helper function to create a dataloader of any type as well as load it with the correct key
 * @param cb Callback function that takes the value to load as well as the type of dataloader to use
 * @returns A promise of type E
 * @throws Error if key is undefiend
 */
export const useDataLoader = <T, E>(cb: DataLoaderCallback<T, E>) => (
  model: T,
  _: StrictObject,
  ctx: Context,
) => {
  const { key, dataLoader } = cb(model, ctx);
  if (!key) {
    throw new Error('Missing key in DataLoader');
  }
  return dataLoader.load(key);
};
