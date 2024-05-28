import { app } from '@/app/app';
import tokenProvider from '@/auth';
import FileAPI from '@api/file';
import { HeheAPI } from '@api/hehe';
import { AccessType, Feature, File, FileType } from '@generated/graphql';
import { removeUploadedFiles, UploadFileOptions, baseUploadFile } from '@test/utils/fileUpload';
import { genRandomUser } from '@test/utils/utils';
import path from 'path';
import request from 'supertest';

const heheApi = new HeheAPI();
const fileApi = new FileAPI();

const testFile = 'test-hehe.pdf';

const r = request(app);

const [createDummyUser, deleteDummyUser] = genRandomUser([Feature.HeheAdmin, Feature.FilesAdmin]);

let USERNAME0 = ''; // Initial dummy value
let accessToken = '';

const removeCreatedFiles = async () => {
  await removeUploadedFiles(fileApi);
};

beforeAll(async () => {
  USERNAME0 = (await createDummyUser()).username;
  accessToken = tokenProvider.issueToken(USERNAME0, 'access_token');
});

afterEach(async () => {
  await removeCreatedFiles();
});

afterAll(async () => {
  await deleteDummyUser();
});

const uploadFile = (filename: string, opts: UploadFileOptions = {}) => {
  return baseUploadFile(accessToken, 'upload', filename, r, opts);
};

test('create HeHE cover image from PDF', async () => {
  const res: { body: File } = await uploadFile(testFile).expect(200);

  // Ensure file upload is successful
  expect(res.body).toMatchObject({
    accessType: AccessType.Public,
    createdBy: {
      username: USERNAME0,
    },
    name: testFile,
    type: FileType.Pdf,
  });

  // Create HeHE cover page
  const coverId = await heheApi.createHeheCover(USERNAME0, res.body.id);
  const dbFile = await fileApi.getFileData(coverId);

  // Check if cover page is created
  expect(dbFile).toMatchObject({
    type: FileType.Image,
    accessType: AccessType.Public,
    refUploader: USERNAME0,
  });

  // Cover test file must be deleted manually as it is not created by the uploadFile function
  fileApi.deleteFile(coverId);
});
