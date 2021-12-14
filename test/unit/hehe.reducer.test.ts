import { heheReduce } from '../../src/reducers/hehe.reducer';
import type { DatabaseHehe } from '../../src/models/db/hehe';

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
      id: dummyFile
    }
  });
});