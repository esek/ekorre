import { HeheResponse } from '@/models/mappers';
import { DatabaseHehe } from '@db/hehe';

export const heheReduce = (dbHehe: DatabaseHehe): HeheResponse => {
  const { refuploader, reffile, ...reduced } = dbHehe;
  return {
    ...reduced,
    uploader: {
      username: refuploader,
    },
    file: {
      id: reffile,
    },
  };
};
