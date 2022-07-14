import type { FileResponse } from '@/models/mappers';
import type { ETokenProvider } from '@esek/auth-server';
import type { Access, Post, User } from '@generated/graphql';
import type { ExpressContext } from 'apollo-server-express';
import type DataLoader from 'dataloader';
import type { Request, Response } from 'express';

export type Context = {
  accessToken: string;
  refreshToken: string;
  apiKey: string;
  response: Response;
  request: CustomReq;
  getUsername: () => string;
  getAccess: () => Promise<Access>;
  tokenProvider: ETokenProvider;
  userDataLoader: DataLoader<string, User>;
  postDataLoader: DataLoader<number, Post>;
  fileDataLoader: DataLoader<string, FileResponse>;
  electionDataLoader: DataLoader<number, ElectionResponse>;
};

export type ContextParams = Omit<ExpressContext, 'req'> & { req: CustomReq };

type CustomReq = Omit<Request, 'cookies'> & {
  cookies: Record<string, string>;
};
