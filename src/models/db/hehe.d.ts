import { Hehe } from '../../graphql.generated';

export type DatabaseHehe = Omit<Hehe, 'uploader'> & {
  refuploader: string,
  reffile: string,
};
