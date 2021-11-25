import { ExpressContext } from 'apollo-server-express';
import type DataLoader from 'dataloader';
import { Request, Response } from 'express';

import type { Post, User } from '../graphql.generated';
import type { AccessResourceResponse, FileResponse } from '../models/mappers';

export type Context = {
  accessToken: string;
  refreshToken: string;
  response: Response;
  request: CustomReq;
  getUsername: () => string;
  userDataLoader: DataLoader<string, User>;
  postDataLoader: DataLoader<string, Post>;
  fileDataLoader: DataLoader<string, FileResponse>;
  accessResourceDataloader: DataLoader<string, AccessResourceResponse>;
};

export type ContextParams = Omit<ExpressContext, 'req'> & { req: CustomReq };

type CustomReq = Omit<Request, 'cookies'> & {
  cookies: Record<string, string>;
};
