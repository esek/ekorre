import { ExpressContext } from 'apollo-server-express';
import type DataLoader from 'dataloader';
import { Request, Response } from 'express';

import type { User } from '../graphql.generated';

export type Context = {
  accessToken: string;
  refreshToken: string;
  response: Response;
  getUser: () => User;
  userDataLoader: DataLoader<string, User>;
};

export type ContextParams = Omit<ExpressContext, 'req'> & {
  req: Omit<Request, 'cookies'> & {
    cookies: Record<string, string>;
  };
};
