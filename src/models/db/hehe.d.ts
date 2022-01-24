import { Hehe } from '@generated/graphql';

export type DatabaseHehe = Omit<Hehe, 'uploader' | 'file'> & {
  refuploader: string;
  reffile: string;
};
