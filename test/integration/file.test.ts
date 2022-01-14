import axios from 'axios';
import { createWriteStream, ReadStream, rmSync } from 'fs';
import { resolve } from 'path';
import request from 'supertest';

import FileAPI from '../../src/api/file.api';
import { app } from '../../src/app';
import { COOKIES, issueToken } from '../../src/auth';
import { AccessType, File as GqlFile, FileType } from '../../src/graphql.generated';

const fileApi = new FileAPI();

// get example image from lorem picsum
const URL = 'https://picsum.photos/200';

const TEST_FILE_NAME = 'lorem-picusm.jpg';
const TEST_USERNAME = 'no0000oh-s';

const path = resolve(__dirname, '../data', TEST_FILE_NAME);

describe('uploading files', () => {
  /* download example file */
  beforeAll((cb) => {
    axios.get<ReadStream>(URL, { method: 'GET', responseType: 'stream' }).then((res) => {
      const w = res.data.pipe(createWriteStream(path));
      w.on('finish', cb);
    });
  });

  /* Remove temp file and clear from db */
  afterAll(async () => {
    rmSync(path, { force: true });

    // Search all files that contain the test file name
    const createdFiles = await fileApi.searchFiles(TEST_FILE_NAME);

    const deletes = createdFiles.map((file) => fileApi.deleteFile(file.id));

    await Promise.all(deletes);
  });

  const r = request(app);

  const attachFile = (username = TEST_USERNAME, withFile = true, isAvatar = false) => {
    const token = issueToken({ username }, 'accessToken');

    const req = r
      .post(`/files/upload${isAvatar ? '/avatar' : ''}`)
      .field('name', TEST_FILE_NAME)
      .set('Cookie', [`${COOKIES.accessToken}=${token}`]);

    if (withFile) {
      req.attach('file', path);
    }

    return req;
  };

  test('without a file', async () => {
    await attachFile(TEST_USERNAME, false).expect(400);
  });

  test('without a username', async () => {
    await attachFile('', true).expect(401);
  });

  test('with username that does not exist', async () => {
    await attachFile('ba1234js-s', true).expect(401);
  });

  test('without accessstype', async () => {
    const res = await attachFile().expect(200);

    expect(res.body).toMatchObject({
      accessType: AccessType.Public,
      createdBy: {
        username: TEST_USERNAME,
      },
      name: TEST_FILE_NAME,
      type: FileType.Image,
    });
  });

  test('with accesstype', async () => {
    const res = await attachFile().field('accessType', AccessType.Authenticated).expect(200);

    expect(res.body).toMatchObject({
      accessType: AccessType.Authenticated,
      createdBy: {
        username: TEST_USERNAME,
      },
      name: TEST_FILE_NAME,
      type: FileType.Image,
    });
  });

  test('in subfolder', async () => {
    const res = await attachFile().field('path', 'test-folder').expect(200);

    expect(res.body).toMatchObject({
      accessType: AccessType.Public,
      createdBy: {
        username: TEST_USERNAME,
      },
      name: TEST_FILE_NAME,
    });

    expect((res.body as GqlFile).folderLocation).toMatch(/test-folder/);
  });

  // A request with multiple files should still just result in one file being uploaded
  test('multiple files', async () => {
    const res = await attachFile().attach('file', path).expect(200);

    expect(res.body).toMatchObject({
      accessType: AccessType.Public,
      createdBy: {
        username: TEST_USERNAME,
      },
      name: TEST_FILE_NAME,
    });
  });

  describe('avatars', () => {
    test('without a file', async () => {
      await attachFile(TEST_USERNAME, false, true).expect(400);
    });

    test('without a username', async () => {
      await attachFile('', true, true).expect(401);
    });

    test('with a file', async () => {
      const res = await attachFile(TEST_USERNAME, true, true).expect(200);

      expect(res.body).toMatchObject({
        accessType: AccessType.Authenticated,
        createdBy: {
          username: TEST_USERNAME,
        },
        name: TEST_FILE_NAME,
        type: FileType.Image,
      });
    });

    test('override existing', async () => {
      const res1 = await attachFile(TEST_USERNAME, true, true).expect(200);

      expect(res1.body).toMatchObject({
        accessType: AccessType.Authenticated,
        createdBy: {
          username: TEST_USERNAME,
        },
        name: TEST_FILE_NAME,
        type: FileType.Image,
      });
    });
  });
});
