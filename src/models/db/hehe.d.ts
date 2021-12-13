import { Hehe } from '../../graphql.generated';

export type DatabaseHehe = Omit<Hehe, 'uploader' | 'file'> & {
  refuploader: string,
  reffile: string,
};
