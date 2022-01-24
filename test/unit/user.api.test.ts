import { PASSWORD_RESET_TABLE, USER_TABLE } from '@/api/constants';
import db from '@/api/knex';
import { UserAPI } from '@/api/user.api';
import { BadRequestError, NotFoundError, UnauthenticatedError } from '@/errors/request.errors';
import { DatabaseUser } from '@/models/db/user';
import { NewUser } from '@generated/graphql';

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
  await db(USER_TABLE)
    .delete()
    .whereIn('username', [mockNewUser1.username, `funcUser_${mockNewUser1.username}`]);
  // Delete EVERYTHING
  await db(PASSWORD_RESET_TABLE).delete().where('token', '=', null);
  jest.useRealTimers();
});

afterAll(async () => {
  await db(USER_TABLE).delete().whereIn('username', [mockNewUser0.username, mockNewUser1.username]);
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
  ).resolves.toHaveLength(0);
});

test('updating existing user', async () => {
  const uu: Partial<DatabaseUser> = {
    firstName: 'Adolf',
    phone: '1234657890',
    address: 'Kämnärsvägen 22F',
    zipCode: '22645',
    website: 'apkollen.se',
  };

  await api.createUser(mockNewUser1);
  const dbRes = await api.getSingleUser(mockNewUser1.username);

  dbRes.isFuncUser = !!dbRes.isFuncUser;

  expect(dbRes).toMatchObject(dbRes);

  await api.updateUser(mockNewUser1.username, uu);
  const uDbRes = await api.getSingleUser(mockNewUser1.username);

  expect(uDbRes).toMatchObject(uu);
});

test('updating username', async () => {
  await api.createUser(mockNewUser1);
  await expect(
    api.updateUser(mockNewUser1.username, { username: 'Not a good username' }),
  ).rejects.toThrowError(new BadRequestError('Användarnamn kan inte uppdateras'));
});

test('updating non-existant user', async () => {
  await expect(api.updateUser('Obv. fake username', { firstName: 'Adolf' })).rejects.toThrowError(
    BadRequestError,
  );
});

test('search for users by username that exists', async () => {
  await api.createUser(mockNewUser1);
  expect((await api.searchUser('Test1')).length).toBe(1);
  expect((await api.searchUser('userapi')).length).toBe(2);
});

test('search for user by name that exists', async () => {
  await api.createUser(mockNewUser1);
  expect((await api.searchUser('kalle')).length).toBe(1);
});

test('search for non-existant user', async () => {
  await expect(api.searchUser('Albert')).resolves.toHaveLength(0);
});

// Test för att återställa password

test('changing password for non-existing user', async () => {
  await expect(api.changePassword('Not a user', 'hunter2', 'hunter3')).rejects.toThrowError(
    NotFoundError,
  );
});

test('changing password using wrong oldPassword', async () => {
  const newPassword = 'hunter3';
  await api.createUser(mockNewUser1);
  await expect(
    api.changePassword(mockNewUser1.username, 'Not correct', newPassword),
  ).rejects.toThrowError(UnauthenticatedError);

  // Försäkra oss om att lösen inte ändras
  await expect(api.loginUser(mockNewUser1.username, newPassword)).rejects.toThrowError(
    UnauthenticatedError,
  );
});

test('changing password for valid user', async () => {
  const newPassword = 'hunter3';
  await api.createUser(mockNewUser1);

  // Försäkra sig om att nya lösenordet inte funkar till att börja med
  await expect(api.loginUser(mockNewUser1.username, newPassword)).rejects.toThrowError(
    UnauthenticatedError,
  );

  await api.changePassword(mockNewUser1.username, mockNewUser1.password, newPassword);

  // Försäkra oss om att lösen ändras
  await expect(api.loginUser(mockNewUser1.username, newPassword)).resolves.toBeTruthy();
});

test('validating non-valid resetPasswordToken', async () => {
  expect(await api.validateResetPasswordToken(mockNewUser0.username, 'Not a token')).toBeFalsy();
});

test('validating valid resetPasswordToken for wrong user', async () => {
  await api.createUser(mockNewUser1);
  const token = await api.requestPasswordReset(mockNewUser1.username);
  expect(await api.validateResetPasswordToken(mockNewUser0.username, token)).toBeFalsy();
});

test('validating valid resetPasswordToken for correct user', async () => {
  await api.createUser(mockNewUser1);
  const token = await api.requestPasswordReset(mockNewUser1.username);
  expect(await api.validateResetPasswordToken(mockNewUser1.username, token)).toBeTruthy();
});

test('reset password for non-valid username/token', async () => {
  await expect(api.resetPassword('Not a token', 'Not a username', 'drrr')).rejects.toThrowError(
    NotFoundError,
  );
});

test('reset password with expired resetPasswordToken', async () => {
  await api.createUser(mockNewUser1);
  const token = await api.requestPasswordReset(mockNewUser1.username);

  // Vi fejkar nu att system time är 1h fram
  const expireMinutes = 60;
  const trueTime = new Date();
  jest.useFakeTimers().setSystemTime(new Date(trueTime.getTime() + expireMinutes * 60000));

  await expect(
    api.resetPassword(mockNewUser1.username, token, 'drr password'),
  ).rejects.toThrowError(NotFoundError);
});

test('reset password properly', async () => {
  await api.createUser(mockNewUser1);
  const token = await api.requestPasswordReset(mockNewUser1.username);
  const newPassword = 'Detta test skrevs på valmötet 2021';

  // Försäkra sig om att nya lösenordet inte funkar till att börja med
  await expect(api.loginUser(mockNewUser1.username, newPassword)).rejects.toThrowError(
    UnauthenticatedError,
  );

  await api.resetPassword(token, mockNewUser1.username, newPassword);

  // Försäkra oss om att lösen ändras
  await expect(api.loginUser(mockNewUser1.username, newPassword)).resolves.toBeTruthy();
});
