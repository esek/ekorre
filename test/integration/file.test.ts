import { app } from '@/app/app';
import { COOKIES, issueToken } from '@/auth';
import config from '@/config';
import FileAPI from '@api/file';
import { UserAPI } from '@api/user';
import { AccessType, Feature, File, FileType, NewUser } from '@generated/graphql';
import requestWithAuth from '@test/utils/requestWithAuth';
import { genUserWithAccess } from '@test/utils/utils';
import { resolve } from 'path';
import request from 'supertest';

type UploadFileOptions = {
  withFile?: boolean;
  withAuth?: boolean;
};

const fileApi = new FileAPI();
const userApi = new UserAPI();

const testFiles = ['test-image.jpeg', 'test-textfile.txt'];
const testUser: NewUser = {
  username: 'emilbajs',
  firstName: 'Blennow',
  lastName: 'Magsjuk',
  password: 'test',
  class: 'E69',
};

const path = (fileName: string) => resolve(__dirname, '../data', fileName);
const [createUser, teardown] = genUserWithAccess(testUser, [Feature.FilesAdmin]);
const baseURL = (endpoint: string) => `${config.FILES.ENDPOINT}/${endpoint}`;

const removeCreatedFiles = async () => {
  const removes = await fileApi.searchFiles('test');
  return Promise.all(removes.map((f) => fileApi.deleteFile(f.id)));
};

beforeAll(async () => {
  await createUser();
});

afterEach(async () => {
  await removeCreatedFiles();
});

afterAll(async () => {
  await Promise.all([removeCreatedFiles(), teardown()]);
});

const r = request(app);

const baseUploadFile = (
  accessToken: string,
  endpoint: string,
  filename: string,
  opts: UploadFileOptions,
) => {
  const req = r.post(baseURL(endpoint)).field('name', filename);
  const { withFile = true, withAuth = true } = opts;

  if (withFile) {
    req.attach('file', path(filename));
  }

  if (withAuth) {
    req.set('Cookie', [`${COOKIES.accessToken}=${accessToken}`]);
  }

  return req;
};

describe('uploading files', () => {
  const accessToken = issueToken({ username: testUser.username }, 'accessToken');

  const uploadFile = (filename: string, opts: UploadFileOptions = {}) => {
    return baseUploadFile(accessToken, 'upload', filename, opts);
  };

  afterEach(async () => {
    await removeCreatedFiles();
  });

  it('fails without a file', async () => {
    await uploadFile('', { withFile: false }).expect(400);
  });

  it('fails without a username', async () => {
    await uploadFile(testFiles[0], { withAuth: false }).expect(401);
  });

  it('can automatically set the accesstype', async () => {
    const res = await uploadFile(testFiles[0]).expect(200);

    expect(res.body).toMatchObject({
      accessType: AccessType.Public,
      createdBy: {
        username: testUser.username,
      },
      name: testFiles[0],
      type: FileType.Image,
    });
  });

  it('can explicitly set the accesstype', async () => {
    const res = await uploadFile(testFiles[0])
      .field('accessType', AccessType.Authenticated)
      .expect(200);

    expect(res.body).toMatchObject({
      accessType: AccessType.Authenticated,
      createdBy: {
        username: testUser.username,
      },
      name: testFiles[0],
      type: FileType.Image,
    });
  });

  it('can upload a file in a subfolder', async () => {
    const [file] = testFiles;
    const res = await uploadFile(file).field('path', 'test-folder').expect(200);

    expect(res.body).toMatchObject({
      accessType: AccessType.Public,
      createdBy: {
        username: testUser.username,
      },
      name: file,
    });

    expect((res.body as File).folderLocation).toMatch(/test-folder/);
  });

  it('can handle multiple files', async () => {
    const [file1, file2] = testFiles;
    const res = await uploadFile(file1).attach('file', path(file2)).expect(200);

    expect(res.body).toMatchObject({
      accessType: AccessType.Public,
      name: file1,
    });

    expect(res.body).not.toMatchObject({
      name: file2,
    });
  });
});

describe('avatars', () => {
  const accessToken = issueToken({ username: testUser.username }, 'accessToken');

  const uploadFile = (filename: string, opts: UploadFileOptions = {}) => {
    return baseUploadFile(accessToken, 'upload/avatar', filename, opts);
  };

  afterEach(async () => {
    await removeCreatedFiles();
  });

  it('fails without a file', async () => {
    await uploadFile('', { withFile: false }).expect(400);
  });

  it('fails without a username', async () => {
    await uploadFile(testFiles[0], { withAuth: false }).expect(401);
  });

  it('can handle multiple files', async () => {
    const [file1, file2] = testFiles;
    const res = await uploadFile(file1).attach('file', path(file2)).expect(200);

    expect(res.body).toMatchObject({
      accessType: AccessType.Authenticated,
      name: file1,
    });

    expect(res.body).not.toMatchObject({
      name: file2,
    });
  });

  it('overrides existing avatar', async () => {
    const res1 = await uploadFile(testFiles[0]).expect(200);
    const user = userApi.getSingleUser(testUser.username);
    expect((await user).photoUrl).toBe(res1.body.folderLocation);

    const res2 = await uploadFile(testFiles[0]).expect(200);
    const updatedUser = await userApi.getSingleUser(testUser.username);
    expect(updatedUser.photoUrl).not.toBe(res1.body.folderLocation);
    expect(updatedUser.photoUrl).toBe(res2.body.folderLocation);
  });
});

describe('fetching files', () => {
  const accessToken = issueToken({ username: testUser.username }, 'accessToken');

  beforeAll(async () => {
    await Promise.all([
      baseUploadFile(accessToken, 'upload', testFiles[0], {})
        .field('accessType', AccessType.Public)
        .expect(200),
      baseUploadFile(accessToken, 'upload', testFiles[0], {})
        .field('accessType', AccessType.Authenticated)
        .expect(200),
      baseUploadFile(accessToken, 'upload', testFiles[1], {})
        .field('accessType', AccessType.Admin)
        .expect(200),
    ]);
  });

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
    const res = await requestWithAuth(GET_FILES_QUERY, {}, accessToken);

    expect(res.errors).toBeUndefined();
    expect((res.data?.files as File[])?.length).toBeGreaterThan(0);
  });

  it('gets files by type', async () => {
    const res = await requestWithAuth(GET_FILES_QUERY, { type: FileType.Image }, accessToken);

    expect(res.errors).toBeUndefined();
    expect((res.data?.files as File[])?.length).toBeGreaterThan(0);

    expect(res.data?.files).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: FileType.Image })]),
    );
    expect(res.data?.files).toEqual(
      expect.not.arrayContaining([expect.objectContaining({ type: FileType.Text })]),
    );
  });

  it('gets a single file', async () => {
    const [file] = await fileApi.getMultipleFiles(FileType.Image);

    const res = await requestWithAuth(GET_FILE_QUERY, { id: file.id }, accessToken);

    expect(res.errors).toBeUndefined();
    expect(res.data?.file).toMatchObject({
      id: file.id,
      name: testFiles[0],
      type: FileType.Image,
    });
  });

  it('gets the correct files in the filesystem', async () => {
    const res = await requestWithAuth(GET_FILESYSTEM_QUERY, { folder: '' }, accessToken);

    expect(res.errors).toBeUndefined();

    expect(res.data?.fileSystem).toMatchObject({
      files: expect.arrayContaining([
        expect.objectContaining({
          name: testFiles[0],
        }),
      ]) as unknown[], // super ugly but ts complains
    });
  });

  it('fails if trying to serach for nothing', async () => {
    const res = await requestWithAuth(SEARCH_FILES_QUERY, { search: '' }, accessToken);

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
    const res = await requestWithAuth(SEARCH_FILES_QUERY, { search: testFiles[0] }, accessToken);

    expect(res.errors).toBeUndefined();

    expect((res.data?.searchFiles as File[])?.length).toBeGreaterThan(0);

    expect(res.data?.searchFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: testFiles[0],
        }),
      ]),
    );
  });
});

describe('reading files', () => {
  const accessToken = issueToken({ username: testUser.username }, 'accessToken');

  beforeAll(async () => {
    await Promise.all([
      baseUploadFile(accessToken, 'upload', testFiles[0], {})
        .field('accessType', AccessType.Public)
        .expect(200),
      baseUploadFile(accessToken, 'upload', testFiles[0], {})
        .field('accessType', AccessType.Authenticated)
        .expect(200),
      baseUploadFile(accessToken, 'upload', testFiles[1], {})
        .field('accessType', AccessType.Admin)
        .expect(200),
    ]);
  }, 10000);

  /**
   * Gets the content type from the response headers
   * @param headers request headers
   */
  const getContentType = (headers: Record<string, string>) => {
    return headers['content-type'];
  };

  const getFile = async (accessType: AccessType) => {
    const files = await fileApi.getMultipleFiles();
    const file = files.find((f) => f.accessType === accessType);

    if (!file) {
      throw new Error(`Could not find file with accesstype ${accessType}`);
    }

    return file;
  };

  it('can read a public file', async () => {
    const file = await getFile(AccessType.Public);
    const res = await r.get(baseURL(file.folderLocation)).expect(200);
    expect(getContentType(res.headers)).toBe('image/jpeg');
  });

  it("can't read a file that requires authentication", async () => {
    const file = await getFile(AccessType.Authenticated);
    await r.get(baseURL(file.folderLocation)).expect(403);
  });

  it('can read an authenticated file', async () => {
    const file = await getFile(AccessType.Authenticated);
    const res = await r
      .get(baseURL(file.folderLocation))
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(getContentType(res.headers)).toBe('image/jpeg');
  });

  it('can get the token is in cookie', async () => {
    const file = await getFile(AccessType.Authenticated);
    const res = await r
      .get(baseURL(file.folderLocation))
      .set('Cookie', `e-access-token=${accessToken}`)
      .expect(200);

    expect(getContentType(res.headers)).toBe('image/jpeg');
  });

  it('can get the token is in query', async () => {
    const file = await getFile(AccessType.Authenticated);
    const res = await r.get(baseURL(file.folderLocation)).query({ token: accessToken }).expect(200);

    expect(getContentType(res.headers)).toBe('image/jpeg');
  });

  it('can get the bearer token is in header', async () => {
    const file = await getFile(AccessType.Authenticated);
    const res = await r
      .get(baseURL(file.folderLocation))
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(getContentType(res.headers)).toBe('image/jpeg');
  });

  it('can get the token is in header', async () => {
    const file = await getFile(AccessType.Authenticated);
    const res = await r
      .get(baseURL(file.folderLocation))
      .set('authorization', accessToken)
      .expect(200);
    expect(getContentType(res.headers)).toBe('image/jpeg');
  });

  it('returns 404 if the file is not found', async () => {
    await r.get(baseURL('not-found.txt')).expect(404);
  });
});
