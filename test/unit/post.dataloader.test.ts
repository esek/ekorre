import { POSTS_TABLE } from '@/api/constants';
import db from '@/api/knex';
import { createDataLoader, useDataLoader } from '@/dataloaders';
import { batchPostsFunction, postApi } from '@/dataloaders/post.dataloader';
import { NotFoundError } from '@/errors/RequestErrors';
import { DatabasePost } from '@/models/db/post';
import { reduce } from '@/reducers';
import { postReduce } from '@/reducers/post.reducer';
import { Post, PostType, Utskott } from '@generated/graphql';

// Vi kontrollerar antal anrop till API:n
const apiSpy = jest.spyOn(postApi, 'getMultiplePosts');
const mockPosts: DatabasePost[] = [
  {
    active: true,
    description: 'Minskar InfUs budget',
    interviewRequired: true,
    postType: PostType.Ea,
    postname: 'Budgetman',
    spots: -1,
    utskott: Utskott.Fvu,
  },
  {
    active: false,
    description: 'Går på Sensation Red',
    interviewRequired: true,
    postType: PostType.ExactN,
    postname: 'Tinderchef',
    spots: 69,
    utskott: Utskott.Styrelsen,
  },
  {
    active: true,
    description: 'Är med i automatiska tester',
    interviewRequired: false,
    postType: PostType.N,
    postname: 'Testmästare',
    spots: 2,
    utskott: Utskott.Infu,
  },
];

beforeEach(() => {
  // För att vi ska återställa räkningen
  // av anrop
  jest.clearAllMocks();
});

beforeAll(async () => {
  // Insert fake users
  await db<DatabasePost>(POSTS_TABLE).insert(mockPosts);
});

afterAll(async () => {
  await db<DatabasePost>(POSTS_TABLE)
    .delete()
    .whereIn(
      'postname',
      mockPosts.map((p) => p.postname),
    );
});

test('load single post', async () => {
  const pl = createDataLoader(batchPostsFunction);
  const post = await pl.load('Testmästare');

  // SQLite makes these conversions neccessary
  post.active = !!post.active;
  post.interviewRequired = !!post.interviewRequired;

  const mockUser = reduce(mockPosts.filter((p) => p.postname === 'Testmästare')[0], postReduce);
  expect(post).toMatchObject(mockUser);
  expect(apiSpy).toHaveBeenCalledTimes(1);
});

test('load multiple posts', async () => {
  const dl = createDataLoader(batchPostsFunction);
  await Promise.all(
    mockPosts.map(async (p) => {
      const post = await dl.load(p.postname);
      post.active = !!post.active;
      post.interviewRequired = !!post.interviewRequired;

      const mockPost = reduce(p, postReduce);
      expect(post).toMatchObject(mockPost);
    }),
  );
  expect(apiSpy).toHaveBeenCalledTimes(1);
});

test('loading multiple existant and non-existant posts', async () => {
  const postnames = ['Obv. fake postname lol', ...mockPosts.map((p) => p.postname)];
  const pl = createDataLoader(batchPostsFunction);
  await Promise.all(
    postnames.map(async (name) => {
      // If mockUsers contain a user with this username,
      // expect the load of that name to be that user
      if (mockPosts.map((p) => p.postname).includes(name)) {
        const post = await pl.load(name);

        post.active = !!post.active;
        post.interviewRequired = !!post.interviewRequired;

        const mockPost = reduce(mockPosts.filter((p) => p.postname === name)[0], postReduce);

        // We don't care about date and such, but the result should contain mockPost
        expect(post).toMatchObject(mockPost);
      } else {
        // We expect an error for the fake one
        await expect(pl.load(name)).rejects.toThrowError(NotFoundError);
      }
    }),
  );
});

test('loading non-existant post', async () => {
  const fakePostname = 'This is not a valid username.com!';
  const pl = createDataLoader(batchPostsFunction);
  await expect(pl.load(fakePostname)).rejects.toThrowError();
  expect(apiSpy).toHaveBeenCalledTimes(1);
});

test('load post using useDataloader', async () => {
  const postDataLoader = createDataLoader(batchPostsFunction);
  const pl = useDataLoader<string, Post>((key, ctx) => ({
    key,
    dataLoader: ctx.postDataLoader,
  }));

  // To ignore context error
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const post = await pl('Testmästare', {}, { postDataLoader });

  post.active = !!post.active;
  post.interviewRequired = !!post.interviewRequired;

  const mockPost = reduce(mockPosts.filter((p) => p.postname === 'Testmästare')[0], postReduce);

  // We don't care about date and such, but the result should contain mockPost
  expect(post).toMatchObject(mockPost);
});
