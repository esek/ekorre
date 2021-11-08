/**
 * Generic reduce method with overloading to use reducer-callback to map to correct response object / array of object
 * @param obj The object to reduce
 * @param cb Callback for handling reduction
 * @returns Mapped object / array of object of type E
 */

export function reduce<T, E>(obj: T, cb: (obj: T) => E): E;
export function reduce<T, E>(obj: T[], cb: (obj: T) => E): E[];
export function reduce<T, E>(obj: T | T[], cb: (obj: T) => E): E | E[] {
  if (Array.isArray(obj)) {
    // We don't want to reduce empty array objects,
    if (obj.length !== 0 || obj instanceof Array) {
      return obj.map(cb);
    }
    return [];
  }
  return cb(obj);
}
