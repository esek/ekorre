import { createDataLoader } from '@/dataloaders';
import { batchUsersFunction, userApi } from '@/dataloaders/user.dataloader';
import { NotFoundError } from '@/errors/request.errors';
import { reduce } from '@/reducers';
import { userReduce } from '@/reducers/user.reducer';
import { PrismaUser } from '@prisma/client';
import { genRandomUser } from '@test/utils/utils';

const [createUser0, deleteUser0] = genRandomUser([]);
const [createUser1, deleteUser1] = genRandomUser([]);
const [createUser2, deleteUser2] = genRandomUser([]);

// Vi kontrollerar antal anrop till API:n
const apiSpy = jest.spyOn(userApi, 'getMultipleUsers');
let mockUsers: PrismaUser[] = [];

beforeEach(() => {
  // För att vi ska återställa räkningen
  // av anrop
  jest.clearAllMocks();
});

beforeAll(async () => {
  // Insert fake users
  mockUsers = await Promise.all([createUser0(), createUser1(), createUser2()]);
});

afterAll(async () => {
  await Promise.all([deleteUser0(), deleteUser1(), deleteUser2()]);
});

test('load single user', async () => {
  const mockUser0 = reduce(mockUsers[0], userReduce);

  const dl = createDataLoader(batchUsersFunction);
  const user = await dl.load(mockUser0.username);

  expect(user).toMatchObject(mockUser0);
  expect(apiSpy).toHaveBeenCalledTimes(1);
});

test('load multiple users', async () => {
  const dl = createDataLoader(batchUsersFunction);
  await Promise.all(
    mockUsers.map(async (u) => {
      const user = await dl.load(u.username);
      const mockUser = reduce(u, userReduce);
      expect(user).toMatchObject(mockUser);
    }),
  );
  expect(apiSpy).toHaveBeenCalledTimes(1);
});

test('loading multiple existant and non-existant users', async () => {
  const usernames = ['Obv. fake username lol', ...mockUsers.map((u) => u.username)];
  const dl = createDataLoader(batchUsersFunction);
  await Promise.all(
    usernames.map(async (name) => {
      // If mockUsers contain a user with this username,
      // expect the load of that name to be that user
      if (mockUsers.map((u) => u.username).includes(name)) {
        const user = await dl.load(name);

        const mockUser = reduce(mockUsers.filter((u) => u.username === name)[0], userReduce);

        // We don't care about date and such, but the result should contain mockUser
        expect(user).toMatchObject(mockUser);
      } else {
        // We expect an error for the fake one
        await expect(dl.load(name)).rejects.toThrowError(NotFoundError);
      }
    }),
  );
  expect(apiSpy).toHaveBeenCalledTimes(1);
});

test('loading non-existant user', async () => {
  const fakeUsername = 'This is not a valid username.com!';
  const dl = createDataLoader(batchUsersFunction);
  await expect(dl.load(fakeUsername)).rejects.toThrowError(NotFoundError);
  expect(apiSpy).toHaveBeenCalledTimes(1);
});
