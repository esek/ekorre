import config from '@/config';
import { FileResponse } from '@/models/mappers';
import { fileReduce } from '@/reducers/file.reducer';
import { AccessType, FileType } from '@generated/graphql';
import { PrismaFile } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const { FILES } = config;

const testDbFile: PrismaFile = {
  id: '098f6bcd4621d373cade4e832627b4f6.txt',
  name: 'text.txt',
  type: FileType.Text,
  folderLocation: '/6f837f0400bd1eb70f3648fc31343ecc/098f6bcd4621d373cade4e832627b4f6.txt',
  accessType: AccessType.Authenticated,
  refUploader: 'aa0000bb-s',
  createdAt: new Date('1999-03-13'), // Mock date
};

const expectedFileResponse: FileResponse = {
  ...testDbFile,
  accessType: testDbFile.accessType as AccessType,
  type: testDbFile.type as FileType,
  url: `${process.env.FILES_ENDPOINT ?? '/files'}${testDbFile.folderLocation}`,
  createdBy: {
    username: 'aa0000bb-s',
  },
  size: 11, // Bytes
};

test('fileReducer with mocked DatabaseFile', () => {
  const filePath = `${FILES.ROOT}${testDbFile.folderLocation}`;

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, 'Hello World');

  expect(fileReduce(testDbFile)).toStrictEqual(expectedFileResponse);

  fs.rmSync(path.dirname(filePath), { recursive: true });
});
