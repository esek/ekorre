import type { File } from '@generated/graphql';

export type DatabaseFile = Omit<File, 'createdBy' | 'url' | 'size'> & {
  refuploader: string;
};
