import type DataLoader from 'dataloader';

import type { User } from '../graphql.generated';

export type Context = {
  token: string;
  getUser: () => User;
  userDataLoader: DataLoader<string, User>;
};
