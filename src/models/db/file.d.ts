import type { File } from '../../graphql.generated';

export type DatabaseFile = Omit<File, 'createdBy' | 'url' | 'size'> & {
  refuploader: string;
};
