import type DataLoader from 'dataloader';
import { Response } from 'express';

import type { User } from '../graphql.generated';

export type Context = {
  accessToken: string;
  refreshToken: string;
  response: Response;
  getUser: () => User;
  userDataLoader: DataLoader<string, User>;
};
