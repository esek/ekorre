import { DatabaseHehe } from '../models/db/hehe';
import { HeheResponse } from '../models/mappers';

export const heheReduce = (dbHehe: DatabaseHehe): HeheResponse => {
  const { refuploader, reffile, ...reduced } = dbHehe;
  return {
    ...reduced,
    uploader: {
      username: refuploader,
    },
    file: {
      id: reffile,
    }
  };
};