import { FileType, AccessType } from '../../src/graphql.generated';
import { DatabaseFile } from '../../src/models/db/file';
import { FileResponse } from '../../src/models/mappers';
import { fileReduce } from '../../src/reducers/file.reducer';

const testDbFile: DatabaseFile = {
  id: '098f6bcd4621d373cade4e832627b4f6.txt',
  name: 'text.txt',
  type: FileType.Text,
  folderLocation: '/6f837f0400bd1eb70f3648fc31343ecc/098f6bcd4621d373cade4e832627b4f6.txt',
  accessType: AccessType.Authenticated,
  refuploader: 'aa0000bb-s',
  createdAt: new Date('1999-03-13'), // Mock date
};

const expectedFileResponse: FileResponse = {
  ...testDbFile,
  url: `${process.env.FILES_ENDPOINT ?? '/files'}${testDbFile.folderLocation}`,
  createdBy: {
    username: 'aa0000bb-s',
  },
  size: 37, // Bytes
};

test('fileReducer with mocked DatabaseFile', () => {
  expect(fileReduce(testDbFile)).toStrictEqual(expectedFileResponse);
});
