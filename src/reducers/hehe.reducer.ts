import { HeheResponse } from '@/models/mappers';
import { PrismaHehe } from '@prisma/client';

export const heheReduce = (dbHehe: PrismaHehe): HeheResponse => {
  const { refUploader, refFile, ...reduced } = dbHehe;
  return {
    ...reduced,
    uploader: {
      username: refUploader,
    },
    file: {
      id: refFile,
    },
  };
};
