import { USER_TABLE } from '../../src/api/constants';
import knex from '../../src/api/knex';
import { UserAPI } from '../../src/api/user.api';
import {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} from '../../src/errors/RequestErrors';
import { NewUser, UpdateUser } from '../../src/graphql.generated';
import { DatabaseUser } from '../../src/models/db/user';

const api = new UserAPI();

// Ska vara tillgänglig för alla test
const mockNewUser0: NewUser = {
  username: 'userApiTest0',
  firstName: 'Albrecht',
  lastName: 'Testfall',
  class: 'BME07',
  password: 'hunter2',
};

// Att anv'ndas godtyckligt
const mockNewUser1: NewUser = {
  username: 'userApiTest1',
  firstName: 'Kalle',
  lastName: 'Testman',
  class: 'E72',
  password: 'weed42069',
};

beforeAll(async () => {
  await api.createUser(mockNewUser0);
});

afterEach(async () => {
  await knex(USER_TABLE)
    .delete()
    .whereIn('username', [mockNewUser1.username, `funcUser_${mockNewUser1.username}`]);
});

afterAll(async () => {
  await knex(USER_TABLE)
    .delete()
    .whereIn('username', [mockNewUser0.username, mockNewUser1.username]);
});

test('create new valid non-funcUser user without email', async () => {
  const resDbUser = await api.createUser(mockNewUser1);
  const dbUser = await api.getSingleUser(mockNewUser1.username);

  // Convert from SQLite to boolean
  dbUser.isFuncUser = !!dbUser.isFuncUser;

  // dbUser will contain some null values
  expect(dbUser).toMatchObject(resDbUser);
  expect(dbUser.passwordSalt).not.toContain(mockNewUser1.password);
  expect(dbUser.passwordHash).not.toContain(mockNewUser1.password);

  // Antar studentmail om inget annat ges
  expect(dbUser.email).toStrictEqual(`${mockNewUser1.username}@student.lu.se`);
  expect(dbUser.isFuncUser).toBeFalsy();
});

test('create new valid non-funcUser user with email', async () => {
  const localMu = { email: 'mrcool@apkollen.se', ...mockNewUser1 };

  const resDbUser = await api.createUser(localMu);
  const dbUser = await api.getSingleUser(localMu.username);

  // Convert from SQLite to boolean
  dbUser.isFuncUser = !!dbUser.isFuncUser;

  // dbUser will contain some null values
  expect(dbUser).toMatchObject(resDbUser);
  expect(dbUser.passwordSalt).not.toContain(localMu.password);
  expect(dbUser.passwordHash).not.toContain(localMu.password);

  // Antar studentmail om inget annat ges
  expect(dbUser.email).toStrictEqual(localMu.email);
  expect(dbUser.isFuncUser).toBeFalsy();
});

test('create new non-funcUser user with empty username', async () => {
  const localMu = { ...mockNewUser1 };
  localMu.username = '';

  await expect(api.createUser(localMu)).rejects.toThrowError(BadRequestError);
  await expect(api.getSingleUser(localMu.username)).rejects.toThrowError(NotFoundError);
});

test('create new non-funcUser user with funcUser prefix', async () => {
  const localMu = { ...mockNewUser1 };
  localMu.username = `funcUser_${localMu.username}`;

  await expect(api.createUser(localMu)).rejects.toThrowError(BadRequestError);
  await expect(api.getSingleUser(localMu.username)).rejects.toThrowError(NotFoundError);
});

test('creating duplicate user fails', async () => {
  await expect(api.createUser(mockNewUser0)).rejects.toThrowError(BadRequestError);
});

test('create new valid funcUser user', async () => {
  const localMu = { email: 'mrcool@apkollen.se', ...mockNewUser1 };
  localMu.username = `funcUser_${localMu.username}`;
  localMu.isFuncUser = true;

  const resDbUser = await api.createUser(localMu);
  const dbUser = await api.getSingleUser(localMu.username);

  // Convert from SQLite to boolean
  dbUser.isFuncUser = !!dbUser.isFuncUser;

  // dbUser will contain some null values
  expect(dbUser).toMatchObject(resDbUser);
  expect(dbUser.passwordSalt).not.toContain(localMu.password);
  expect(dbUser.passwordHash).not.toContain(localMu.password);

  // Alla funcUsers ska ha no-reply
  expect(dbUser.email).toStrictEqual('no-reply@esek.se');
  expect(dbUser.isFuncUser).toBeTruthy();
});

test('create new funcUser user without funcUser prefix', async () => {
  const localMu = { email: 'mrcool@apkollen.se', ...mockNewUser1 };
  localMu.isFuncUser = true;

  const expectedUsername = `funcUser_${localMu.username}`;

  const resDbUser = await api.createUser(localMu);
  const dbUser = await api.getSingleUser(expectedUsername);

  // Convert from SQLite to boolean
  dbUser.isFuncUser = !!dbUser.isFuncUser;

  // dbUser will contain some null values
  expect(dbUser).toMatchObject(resDbUser);
  expect(dbUser.passwordSalt).not.toContain(localMu.password);
  expect(dbUser.passwordHash).not.toContain(localMu.password);

  // Alla funcUsers ska ha no-reply
  expect(dbUser.email).toStrictEqual('no-reply@esek.se');
  expect(dbUser.isFuncUser).toBeTruthy();
});

test('valid login', async () => {
  const res = await api.loginUser(mockNewUser0.username, mockNewUser0.password);
  const { password, ...expectedPartialRes } = mockNewUser0;
  expect(res).toMatchObject(expectedPartialRes);
});

test('login with other users password', async () => {
  await api.createUser(mockNewUser1);
  await expect(api.loginUser(mockNewUser0.username, mockNewUser1.password)).rejects.toThrowError(
    UnauthenticatedError,
  );
});

test('get one user', async () => {
  const { password, ...expectedResult } = mockNewUser0;
  expect(await api.getSingleUser(mockNewUser0.username)).toMatchObject(expectedResult);
});

test('get multiple users', async () => {
  await api.createUser(mockNewUser1);
  expect((await api.getMultipleUsers([mockNewUser0.username, mockNewUser1.username])).length).toBe(
    2,
  );
});

test('get all users', async () => {
  expect((await api.getAllUsers()).length).toBeGreaterThan(0);
});

test('get non-existat user', async () => {
  await expect(api.getSingleUser('Inte ett verkligt användarnamn')).rejects.toThrowError(
    NotFoundError,
  );
});

test('get multiple non-existant users', async () => {
  await expect(
    api.getMultipleUsers(['fake as shit username', 'and another one here']),
  ).rejects.toThrowError(NotFoundError);
});
