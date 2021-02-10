import type { User } from './graphql.generated';

export type Context = {
  token: string;
  getUser(): User;
  batchUsersFunction(usernames: readonly string[]): PromiseLike<ArrayLike<User | Error>>,
};
