import type { DatabaseHehe } from '@/models/db/hehe';
import { heheReduce } from '@/reducers/hehe.reducer';

test('reducing valid DatabaseHehe', () => {
  const dummyUploader = 'em5184er-s';
  const dummyFile = 'somefcknfileId';
  const dbHehe: DatabaseHehe = {
    number: 5,
    year: 2019,
    refuploader: dummyUploader,
    reffile: dummyFile,
  };

  expect(heheReduce(dbHehe)).toMatchObject({
    number: 5,
    year: 2019,
    uploader: {
      username: dummyUploader,
    },
    file: {
      id: dummyFile,
    },
  });
});
