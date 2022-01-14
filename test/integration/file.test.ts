import { ApolloServer } from 'apollo-server-express';
import axios from 'axios';
import { createWriteStream, ReadStream, rmSync } from 'fs';
import { resolve } from 'path';
import request from 'supertest';

import { FILE_TABLE } from '../../src/api/constants';
import FileAPI from '../../src/api/file.api';
import db from '../../src/api/knex';
import { app } from '../../src/app';
import { COOKIES, issueToken } from '../../src/auth';
import config from '../../src/config';
import { AccessType, File as GqlFile, FileType } from '../../src/graphql.generated';
import { DatabaseFile } from '../../src/models/db/file';
import apolloServerConfig from '../../src/serverconfig';

const fileApi = new FileAPI();

// get example image from lorem picsum
const URL = 'https://picsum.photos/200';

const TEST_FILE_NAME = 'lorem-picusm.jpg';
const TEST_USERNAME = 'no0000oh-s';

const path = resolve(__dirname, '../data', TEST_FILE_NAME);

const baseURL = (endpoint: string) => `${config.FILES.ENDPOINT}/${endpoint}`;

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
      .post(baseURL(`/upload${isAvatar ? '/avatar' : ''}`))
      .field('name', TEST_FILE_NAME)
      .set('Cookie', [`${COOKIES.accessToken}=${token}`]);

    if (withFile) {
      req.attach('file', path);
    }

    return req;
  };

  it('fails without a file', async () => {
    await attachFile(TEST_USERNAME, false).expect(400);
  });

  it('fails without username', async () => {
    await attachFile('', true).expect(401);
  });

  it('fails with username that doesnt exist', async () => {
    await attachFile('ba1234js-s', true).expect(401);
  });

  it('can automatically set the accesstype', async () => {
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

  it('can explicitly set the accesstype', async () => {
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

  it('can upload a file in a subfolder', async () => {
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
  it('can handle multiple files', async () => {
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
    it('fails without a file', async () => {
      await attachFile(TEST_USERNAME, false, true).expect(400);
    });

    it('fails if there is no username', async () => {
      await attachFile('', true, true).expect(401);
    });

    it('uploads a file', async () => {
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

    it('overrides existing avatar', async () => {
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

    it('can handle multiple files', async () => {
      const res = await attachFile(TEST_USERNAME, true, true).attach('file', path).expect(200);

      expect(res.body).toMatchObject({
        accessType: AccessType.Authenticated,
        createdBy: {
          username: TEST_USERNAME,
        },
        name: TEST_FILE_NAME,
      });
    });
  });
});

describe('fetching files', () => {
  const apolloServer = new ApolloServer({
    ...apolloServerConfig,
    context: (props) => {
      if (typeof apolloServerConfig.context === 'function') {
        return {
          ...(apolloServerConfig.context(props) as Record<string, unknown>),
          getUsername: () => TEST_USERNAME,
        };
      }

      return {};
    },
  });

  const TEST_FOLDER_NAME = 'test-folder';

  const GET_FILES_QUERY = `
    query($type: FileType) {
      files(type: $type) {
        id
        name
        type
        folderLocation
      }
    }
  `;

  const GET_FILE_QUERY = `
    query($id: ID!) {
      file(id: $id) {
        id
        name
        type
        folderLocation
        createdBy {
          username
        }
      }
    }
  `;

  const GET_FILESYSTEM_QUERY = `
    query($folder: String!) {
      fileSystem(folder: $folder) {
        files {
          id
          name
          type
          folderLocation 
        }
        path {
          id
          name
        }
      }
    }
  `;

  const SEARCH_FILES_QUERY = `
    query($search: String!) {
      searchFiles(search: $search) {
        name
        id
      }
    }
  `;

  const CREATE_FOLDER_MUTATION = `
    mutation($path: String!, $name: String!) {
      createFolder(path: $path, name: $name)
    }
  `;

  const DELETE_FILE_MUTATION = `
    mutation($id: ID!) {
      deleteFile(id: $id)
    }
  `;

  it('gets multiple files', async () => {
    const res = await apolloServer.executeOperation({
      query: GET_FILES_QUERY,
    });

    expect(res.errors).toBeUndefined();
    expect((res.data?.files as GqlFile[])?.length).toBeGreaterThan(0);
  });

  it('gets files by type', async () => {
    const res = await apolloServer.executeOperation({
      query: GET_FILES_QUERY,
      variables: {
        type: FileType.Text,
      },
    });

    expect(res.errors).toBeUndefined();
    expect((res.data?.files as GqlFile[])?.length).toBeGreaterThan(0);

    expect(res.data?.files).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'text.txt' })]),
    );

    expect(res.data?.files).toEqual(
      expect.not.arrayContaining([expect.objectContaining({ type: FileType.Image })]),
    );
  });

  it('gets a single file', async () => {
    const testFileId = '098f6bcd4621d373cade4e832627b4f6.txt';

    const res = await apolloServer.executeOperation({
      query: GET_FILE_QUERY,
      variables: {
        id: testFileId,
      },
    });

    expect(res.errors).toBeUndefined();
    expect(res.data?.file).toMatchObject({
      id: testFileId,
      name: 'text.txt',
      type: FileType.Text,
    });
  });

  it('gets the correct files in the filesystem', async () => {
    const res = await apolloServer.executeOperation({
      query: GET_FILESYSTEM_QUERY,
      variables: {
        folder: '',
      },
    });

    expect(res.errors).toBeUndefined();

    expect(res.data?.fileSystem).toMatchObject({
      files: expect.arrayContaining([
        expect.objectContaining({
          name: 'esek.png',
        }),
        expect.not.objectContaining({
          name: 'text.txt', // this file is in a subfolder so it shouldn't be returned
        }),
      ]) as unknown[], // super ugly but ts complains
    });
  });

  it('fails if trying to serach for nothing', async () => {
    const res = await apolloServer.executeOperation({
      query: SEARCH_FILES_QUERY,
      variables: {
        search: '',
      },
    });

    expect(res.errors).toBeDefined();
    expect(res.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorType: 'BadRequestError',
          message: 'Du måste ange en söksträng',
        }),
      ]),
    );
  });

  it('can search for multiple files', async () => {
    const res = await apolloServer.executeOperation({
      query: SEARCH_FILES_QUERY,
      variables: {
        search: 'text',
      },
    });

    expect(res.errors).toBeUndefined();

    expect((res.data?.searchFiles as GqlFile[])?.length).toBe(1);

    expect(res.data?.searchFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'text.txt',
        }),
      ]),
    );
  });

  it('can create a folder', async () => {
    const res = await apolloServer.executeOperation({
      query: CREATE_FOLDER_MUTATION,

      variables: {
        name: TEST_FOLDER_NAME,
        path: '',
      },
    });

    expect(res.errors).toBeUndefined();
    expect(res.data?.createFolder).toBe(true);
  });

  it('can delete the folder', async () => {
    const folder = await db<DatabaseFile>(FILE_TABLE)
      .where({
        name: TEST_FOLDER_NAME,
      })
      .first();

    if (!folder) {
      fail('Folder not found');
    }

    const res = await apolloServer.executeOperation({
      query: DELETE_FILE_MUTATION,
      variables: {
        id: folder.id,
      },
    });

    expect(res.errors).toBeUndefined();
    expect(res.data?.deleteFile).toBe(true);
  });
});

describe('reading files', () => {
  const r = request(app);

  const ESEK_IMAGE = 'c703198a20f148f392061060f651fdb3.png';
  const TEXT_FILE = '6f837f0400bd1eb70f3648fc31343ecc/098f6bcd4621d373cade4e832627b4f6.txt';

  const token = issueToken({ username: TEST_USERNAME }, 'accessToken');

  /**
   * Gets the content type from the response headers
   * @param res request
   */
  const getContentType = (headers: Record<string, string>) => {
    return headers['content-type'];
  };

  it('can read a public file', async () => {
    const res = await r.get(baseURL(ESEK_IMAGE)).expect(200);
    expect(getContentType(res.headers)).toBe('image/png');
  });

  it("can't read a file that requires authentication", async () => {
    await r.get(baseURL(TEXT_FILE)).expect(403);
  });

  it('can get the token is in cookie', async () => {
    const res = await r
      .get(baseURL(TEXT_FILE))
      .set('Cookie', `e-access-token=${token}`)
      .expect(200);

    expect(getContentType(res.headers)).toBe('text/plain; charset=UTF-8');
  });

  it('can get the token is in query', async () => {
    const res = await r.get(baseURL(TEXT_FILE)).query({ token }).expect(200);
    expect(getContentType(res.headers)).toBe('text/plain; charset=UTF-8');
  });

  it('can get the bearer token is in header', async () => {
    const res = await r.get(baseURL(TEXT_FILE)).set('authorization', `Bearer ${token}`).expect(200);
    expect(getContentType(res.headers)).toBe('text/plain; charset=UTF-8');
  });

  it('can get the token is in header', async () => {
    const res = await r.get(baseURL(TEXT_FILE)).set('authorization', token).expect(200);
    expect(getContentType(res.headers)).toBe('text/plain; charset=UTF-8');
  });

  it('returns 404 if the file is not found', async () => {
    await r.get(baseURL('not-found.txt')).expect(404);
  });

  // TODO: Test cases for files that require specific access
});
