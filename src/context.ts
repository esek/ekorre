import type { User } from './graphql.generated';

export type Context = {
  token: string
  getUser(): User
};
