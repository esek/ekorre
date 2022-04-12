import { HeheResponse } from '@/models/mappers';
import { heheReduce } from '@/reducers/hehe.reducer';
import { PrismaHehe } from '@prisma/client';

test('reducing valid DatabaseHehe', () => {
  const dummyUploader = 'em5184er-s';
  const dummyFile = 'somefcknfileId';
  const dbHehe: PrismaHehe = {
    number: 5,
    year: 2019,
    refUploader: dummyUploader,
    refFile: dummyFile,
    uploadedAt: new Date(),
  };

  const expected: HeheResponse = {
    number: 5,
    year: 2019,
    uploader: {
      username: dummyUploader,
    },
    file: {
      id: dummyFile,
    },
  };

  expect(heheReduce(dbHehe)).toMatchObject(expected);
});
