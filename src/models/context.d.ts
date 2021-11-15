import { ExpressContext } from 'apollo-server-express';
import type DataLoader from 'dataloader';
import { Request, Response } from 'express';

import type { User, Post } from '../graphql.generated';
import type { FileResponse } from '../models/mappers';

export type Context = {
  accessToken: string;
  refreshToken: string;
  response: Response;
  request: CustomReq;
  getUser: () => User;
  userDataLoader: DataLoader<string, User>;
  postDataLoader: DataLoader<string, Post>;
  fileDataLoader: DataLoader<string, FileResponse>;
};

export type ContextParams = Omit<ExpressContext, 'req'> & { req: CustomReq };

type CustomReq = Omit<Request, 'cookies'> & {
  cookies: Record<string, string>;
};
