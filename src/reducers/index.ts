/**
 * Generic reduce method with overloading to use reducer-callback to map to correct response object / array of object
 * @param obj The object to reduce
 * @param cb Callback for handling reduction
 * @returns Mapped object / array of object of type E
 */

export function reduce<T, E>(obj: T, cb: (obj: T) => E): E;
export function reduce<T, E>(obj: T[], cb: (obj: T) => E): E[];
export function reduce<T, E>(obj: T | T[], cb: (obj: T) => E): E | E[] {
  return obj instanceof Array ? obj.map(cb) : cb(obj);
}
