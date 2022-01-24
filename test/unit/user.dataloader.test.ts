import { USER_TABLE } from '@/api/constants';
import db from '@/api/knex';
import { createDataLoader } from '@/dataloaders';
import { batchUsersFunction, userApi } from '@/dataloaders/user.dataloader';
import { NotFoundError } from '@/errors/RequestErrors';
import { DatabaseUser } from '@/models/db/user';
import { reduce } from '@/reducers';
import { userReduce } from '@/reducers/user.reducer';

// Vi kontrollerar antal anrop till API:n
const apiSpy = jest.spyOn(userApi, 'getMultipleUsers');
const mockUsers: DatabaseUser[] = [
  {
    username: 'dataloaderTestUser1',
    passwordHash: 'hhhhhhhh',
    passwordSalt: 'duvetvad',
    firstName: 'Jalle',
    lastName: 'Testsson',
    email: 'no-reply@esek.se',
    class: 'E18',
    isFuncUser: false,
  },
  {
    username: 'dataloaderTestUser2',
    passwordHash: 'kkkkkkkk',
    passwordSalt: 'duvetvad',
    firstName: 'Balle',
    lastName: 'Testsson',
    email: 'no-reply@esek.se',
    class: 'C18',
    isFuncUser: false,
  },
  {
    username: 'dataloaderTestUser0',
    passwordHash: 'ddddddddddddddddddddddd',
    passwordSalt: 'duvetvad', // E-votes salt för samtliga valkoder före 2021
    firstName: 'Falle',
    lastName: 'Testsson',
    email: 'no-reply@esek.se',
    class: 'E18',
    isFuncUser: false,
  },
];

beforeEach(() => {
  // För att vi ska återställa räkningen
  // av anrop
  jest.clearAllMocks();
});

beforeAll(async () => {
  // Insert fake users
  await db<DatabaseUser>(USER_TABLE).insert(mockUsers);
});

afterAll(async () => {
  await db<DatabaseUser>(USER_TABLE)
    .delete()
    .whereIn(
      'username',
      mockUsers.map((u) => u.username),
    );
});

test('load single user', async () => {
  const dl = createDataLoader(batchUsersFunction);
  const user = await dl.load('dataloaderTestUser0');
  user.isFuncUser = !!user.isFuncUser;
  const mockUser = reduce(
    mockUsers.filter((u) => u.username === 'dataloaderTestUser0')[0],
    userReduce,
  );
  expect(user).toMatchObject(mockUser);
  expect(apiSpy).toHaveBeenCalledTimes(1);
});

test('load multiple users', async () => {
  const dl = createDataLoader(batchUsersFunction);
  await Promise.all(
    mockUsers.map(async (u) => {
      const user = await dl.load(u.username);
      // SQLite converts false to 0, true to 1,
      // this reconverts
      user.isFuncUser = !!user.isFuncUser;

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

        // SQLite converts false to 0, true to 1,
        // this reconverts
        user.isFuncUser = !!user.isFuncUser;

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
