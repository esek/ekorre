import { NotFoundError } from '@/errors/request.errors';
import type { StrictObject } from '@/models/base';
import { Context } from '@/models/context';
import DataLoader from 'dataloader';

type DataLoaderCallback<T, K, E> = (
  model: T,
  context: Context,
) => {
  key?: K;
  dataLoader: DataLoader<K, E>;
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
 *
 * @example
 * // Use the userDataLoader for this request (context)
 * // using DataBasePostHistory as a model
 * const udl = useDataLoader<DatabasePostHistory, User>((entry, context) => ({
 *      key: entry.refuser,
 *      dataLoader: context.userDataLoader,
 *    }));
 * // userDataLoader uses batchUsersFunction internally,
 * // so no reduce needed
 * const u: User = await udl(e, {}, ctx);
 */
// prettier-ignore
export const useDataLoader =
  <T, K, E>(cb: DataLoaderCallback<T, K, E>) =>
    (model: T, _: StrictObject, ctx: Context) => {
      const { key, dataLoader } = cb(model, ctx);
      if (!key) {
        throw new NotFoundError('Nyckeln kunde inte hittas');
      }
      return dataLoader.load(key);
    };
