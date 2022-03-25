import type { FileResponse } from '@/models/mappers';
import type { Access, Post, User } from '@generated/graphql';
import type { ExpressContext } from 'apollo-server-express';
import type DataLoader from 'dataloader';
import type { Request, Response } from 'express';

export type Context = {
  accessToken: string;
  refreshToken: string;
  response: Response;
  request: CustomReq;
  getUsername: () => string;
  getAccess: () => Promise<Access>;
  userDataLoader: DataLoader<string, User>;
  postDataLoader: DataLoader<string, Post>;
  fileDataLoader: DataLoader<string, FileResponse>;
  electionDataLoader: DataLoader<string, ElectionResponse>;
  articleTagsDataLoader: DataLoader<string, string[]>;
};

export type ContextParams = Omit<ExpressContext, 'req'> & { req: CustomReq };

type CustomReq = Omit<Request, 'cookies'> & {
  cookies: Record<string, string>;
};
