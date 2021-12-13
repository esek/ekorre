import { HeHe } from '../../graphql.generated';

export type DatabaseHeHe = Omit<HeHe, 'uploader'> & {
  refuploader: string,
  reffile: string,
};
