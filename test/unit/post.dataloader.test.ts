import { createDataLoader, useDataLoader } from '@/dataloaders';
import { batchPostsFunction, postApi } from '@/dataloaders/post.dataloader';
import { NotFoundError } from '@/errors/request.errors';
import { reduce } from '@/reducers';
import { postReduce } from '@/reducers/post.reducer';
import { genRandomPost } from '@test/utils/utils';

const [createPost0, deletePost0] = genRandomPost();
const [createPost1, deletePost1] = genRandomPost();
const [createPost2, deletePost2] = genRandomPost();

// Vi kontrollerar antal anrop till API:n
const apiSpy = jest.spyOn(postApi, 'getMultiplePosts');
let mockPostIds: number[] = [];

beforeEach(() => {
  // För att vi ska återställa räkningen
  // av anrop
  jest.clearAllMocks();
});

beforeAll(async () => {
  // Insert fake users
  mockPostIds = (await Promise.all([
    createPost0(),
    createPost1(),
    createPost2(),
  ])).map((p) => p.id);
});

afterAll(async () => {
  await Promise.all([
    deletePost0(),
    deletePost1(),
    deletePost2(),
  ]);
});

test('load single post', async () => {
  const pl = createDataLoader(batchPostsFunction);
  const post = await pl.load(mockPostIds[0]);

  // SQLite makes these conversions neccessary
  post.active = !!post.active;
  post.interviewRequired = !!post.interviewRequired;

  const mockUser = reduce(await postApi.getPost(mockPostIds[0]), postReduce);
  expect(post).toMatchObject(mockUser);
  expect(apiSpy).toHaveBeenCalledTimes(1);
});

test('load multiple posts', async () => {
  const dl = createDataLoader(batchPostsFunction);
  await Promise.all(
    mockPostIds.map(async (id) => {
      const post = await dl.load(id);
      post.active = !!post.active;
      post.interviewRequired = !!post.interviewRequired;

      const mockPost = reduce(await postApi.getPost(id), postReduce);
      expect(post).toMatchObject(mockPost);
    }),
  );
  expect(apiSpy).toHaveBeenCalledTimes(1);
});

test('loading multiple existant and non-existant posts', async () => {
  const postIds = [-69, ...mockPostIds];
  const pl = createDataLoader(batchPostsFunction);
  await Promise.all(
    postIds.map(async (id) => {
      // If mockUsers contain a user with this username,
      // expect the load of that name to be that user
      if (mockPostIds.includes(id)) {
        const post = await pl.load(id);

        post.active = !!post.active;
        post.interviewRequired = !!post.interviewRequired;

        const mockPost = reduce(await postApi.getPost(id), postReduce);

        // We don't care about date and such, but the result should contain mockPost
        expect(post).toMatchObject(mockPost);
      } else {
        // We expect an error for the fake one
        await expect(pl.load(id)).rejects.toThrowError(NotFoundError);
      }
    }),
  );
});

test('loading non-existant post', async () => {
  const fakeId = -1997;
  const pl = createDataLoader(batchPostsFunction);
  await expect(pl.load(fakeId)).rejects.toThrowError();
  expect(apiSpy).toHaveBeenCalledTimes(1);
});

test('load post using useDataloader', async () => {
  const id = mockPostIds[0];
  const postDataLoader = createDataLoader(batchPostsFunction);
  const pl = useDataLoader((key, ctx) => ({
    key,
    dataLoader: ctx.postDataLoader,
  }));

  // To ignore context error
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const loadedPost = await pl(id, {}, { postDataLoader });

  loadedPost.active = !!loadedPost.active;
  loadedPost.interviewRequired = !!loadedPost.interviewRequired;

  const mockPost = reduce(await postApi.getPost(id), postReduce);

  // We don't care about date and such, but the result should contain mockPost
  expect(loadedPost).toMatchObject(mockPost);
});
