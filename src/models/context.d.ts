import type { FileResponse } from '@/models/mappers';
import type { Access, Post, User } from '@generated/graphql';
import type { ExpressContext } from 'apollo-server-express';
import type DataLoader from 'dataloader';
import type { Request, Response } from 'express';

export type Context = {
  bearerToken: string;
  apiKey: string;
  response: Response;
  request: CustomReq;
  getUsername: () => string;
  getAccess: () => Promise<Access>;
  userDataLoader: DataLoader<string, User>;
  postDataLoader: DataLoader<number, Post>;
  fileDataLoader: DataLoader<string, FileResponse>;
  electionDataLoader: DataLoader<number, ElectionResponse>;
  currentHoldersDataLoader: DataLoader<number, string[]>;
};

export type ContextParams = Omit<ExpressContext, 'req'> & { req: CustomReq };

type CustomReq = Omit<Request, 'cookies'> & {
  cookies: Record<string, string>;
};
