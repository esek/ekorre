/**
 * Helper type for creating a Strict Object
 * Used without type-parameters it is a {`string`: `any`} object, ex:
 *
 * ```
 * {
 *  key1: 'hello',
 *  key2: 12
 * }
 * ```
 */

export type StrictObject<TKey = string, TValue = unkonwn> = Record<TKey, TValue>;
