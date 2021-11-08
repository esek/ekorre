import { USER_TABLE } from '../../src/api/constants';
import knex from '../../src/api/knex';
import { useDataLoader, createDataLoader } from '../../src/dataloaders';
import { batchUsersFunction, userApi } from '../../src/dataloaders/user.dataloader';
import { DatabaseUser } from '../../src/models/db/user';

// Vi kontrollerar antal anrop till API:n
const apiSpy = jest.spyOn(userApi, 'getMultipleUsers');
const mockUsernames = ['dataloaderTestUser0', 'dataloaderTestUser1', 'dataloaderTestUser2'];

beforeEach(() => {
  // För att vi ska återställa räkningen
  // av anrop
  jest.clearAllMocks();
});

beforeAll(async () => {
  // Insert fake users
  await knex<DatabaseUser>(USER_TABLE).insert({
    username: 'dataloaderTestUser0',
    passwordHash: 'ddddddddddddddddddddddd',
    passwordSalt: 'duvetvad', // E-votes salt för samtliga valkoder före 2021
    firstName: 'Falle',
    lastName: 'Testsson',
    email: 'no-reply@esek.se',
    class: 'E18',
    isFuncUser: false,
  });
  await knex<DatabaseUser>(USER_TABLE).insert({
    username: 'dataloaderTestUser1',
    passwordHash: 'ddddddddddddddddddddddd',
    passwordSalt: 'duvetvad',
    firstName: 'Jalle',
    lastName: 'Testsson',
    email: 'no-reply@esek.se',
    class: 'E18',
    isFuncUser: false,
  });
  await knex<DatabaseUser>(USER_TABLE).insert({
    username: 'dataloaderTestUser2',
    passwordHash: 'ddddddddddddddddddddddd',
    passwordSalt: 'duvetvad',
    firstName: 'Balle',
    lastName: 'Testsson',
    email: 'no-reply@esek.se',
    class: 'E18',
    isFuncUser: false,
  });
});

afterAll(async () => {
  await knex<DatabaseUser>(USER_TABLE).delete().whereIn('username', mockUsernames);
});

test('load multiple users', async () => {
  const dl = createDataLoader(batchUsersFunction);
  await Promise.all(
    mockUsernames.map(async (name) => {
      const user = await dl.load(name);
      expect(user).not.toBeNull();
    }),
  );
  expect(apiSpy).toHaveBeenCalledTimes(1);
});

test('loading non-existant user', async () => {
  const fakeUsername = 'This is not a valid username.com!';
  const dl = createDataLoader(batchUsersFunction);
  await expect(dl.load(fakeUsername)).rejects.toThrow(`No result for username ${fakeUsername}`);
  expect(apiSpy).toHaveBeenCalledTimes(1);
});
