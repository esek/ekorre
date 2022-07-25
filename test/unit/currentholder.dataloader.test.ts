import { createDataLoader } from '@/dataloaders';
import { postApi } from '@/dataloaders/currentholder.dataloader';
import { batchCurrentHoldersFunction } from '@dataloader/currentholder';
import { genRandomPost, genRandomUser } from '@test/utils/utils';

const [createPost0, deletePost0] = genRandomPost();
const [createPost1, deletePost1] = genRandomPost();
const [createPost2, deletePost2] = genRandomPost();

const [createUser0, deleteUser0] = genRandomUser();
const [createUser1, deleteUser1] = genRandomUser();

// Vi kontrollerar antal anrop till API:n
const apiSpy = jest.spyOn(postApi, 'getCurrentPostHolders');
let mockPostIds: number[] = [];
let mockUsernames: string[] = [];

beforeEach(() => {
  // För att vi ska återställa räkningen
  // av anrop
  jest.clearAllMocks();
});

beforeAll(async () => {
  // Insert fake users
  mockPostIds = (await Promise.all([createPost0(), createPost1(), createPost2()])).map((p) => p.id);
  mockUsernames = (await Promise.all([createUser0(), createUser1()])).map((u) => u.username);
});

afterEach(async () => {
  await Promise.all(mockPostIds.map((id) => postApi.clearHistoryForPost(id)));
})

afterAll(async () => {
  await Promise.all([deletePost0(), deletePost1(), deletePost2()]);
  await Promise.all([deleteUser0, deleteUser1]);
});

test('loading post without holders returns empty list', async () => {
  const chl = createDataLoader(batchCurrentHoldersFunction);
  await expect(chl.load(mockPostIds[0])).resolves.toStrictEqual([]);
  expect(apiSpy).toHaveBeenCalledTimes(1);
});

test('loading post with existing holder', async () => {
  const chl = createDataLoader(batchCurrentHoldersFunction);
  await postApi.addUsersToPost([mockUsernames[0]], mockPostIds[0]);

  const holders = await chl.load(mockPostIds[0]);
  expect(holders).toHaveLength(1);
  expect(holders).toEqual(expect.arrayContaining([mockUsernames[0]]));
  expect(apiSpy).toHaveBeenCalledTimes(1);
});

test('loading post with multiple holders', async () => {
  const chl = createDataLoader(batchCurrentHoldersFunction);
  await postApi.addUsersToPost(mockUsernames, mockPostIds[2]);

  const holders = await chl.load(mockPostIds[2]);
  expect(holders).toHaveLength(2);
  expect(holders).toEqual(expect.arrayContaining(mockUsernames));
  expect(apiSpy).toHaveBeenCalledTimes(1);
});

test('loading multiple posts with multiple holders', async () => {
  const chl = createDataLoader(batchCurrentHoldersFunction);
  await Promise.all([
    postApi.addUsersToPost(mockUsernames, mockPostIds[2]),
    postApi.addUsersToPost([mockUsernames[0]], mockPostIds[0]),
  ]);
  
  await Promise.all(
    mockPostIds.map(async (id, index) => {
      const holders = await chl.load(id);
      if (index === 0) {
        expect(holders).toHaveLength(1);
        expect(holders[0]).toEqual(mockUsernames[0]);
      } else if (index === 1) {
        expect(holders).toHaveLength(0);
      } else {
        expect(holders).toHaveLength(2);
        expect(holders).toEqual(expect.arrayContaining(mockUsernames));
      }
    })
  );
  expect(apiSpy).toHaveBeenCalledTimes(1);
});

test('loading non-existant post', async () => {
  const fakeId = -1997;
  const chl = createDataLoader(batchCurrentHoldersFunction);
  await expect(chl.load(fakeId)).resolves.toHaveLength(0);
})
