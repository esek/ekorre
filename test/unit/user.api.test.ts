import { UserAPI } from '@/api/user.api';
import { BadRequestError, NotFoundError, UnauthenticatedError } from '@/errors/request.errors';
import type { LoginProvider as LoginProviderType } from '@esek/auth-server';
import { LoginProvider, NewUser } from '@generated/graphql';
import { PrismaUser } from '@prisma/client';
import { getRandomUsername } from '@test/utils/utils';

const api = new UserAPI();

// Ska vara tillgänglig för alla test
const mockNewUser0: NewUser = {
  username: getRandomUsername(),
  firstName: 'Albrecht',
  lastName: 'Testfall',
  class: 'BME07',
  password: 'hunter2',
};

// Att användas godtyckligt
const mockNewUser1: NewUser = {
  username: getRandomUsername(),
  firstName: 'Kalle',
  lastName: 'Testman',
  class: 'E72',
  password: 'weed42069',
};

beforeAll(async () => {
  await api.createUser(mockNewUser0);
});

afterEach(async () => {
  try {
    await api.deleteUser(mockNewUser1.username);
  } catch (e) {
    // ignorera
  }
});

afterAll(async () => {
  await api.deleteUser(mockNewUser0.username);
});

test('create new valid user without email', async () => {
  const resDbUser = await api.createUser(mockNewUser1);
  const dbUser = await api.getSingleUser(mockNewUser1.username);

  // Convert from SQLite to boolean

  // dbUser will contain some null values
  expect(dbUser).toMatchObject(resDbUser);
  expect(dbUser.passwordSalt).not.toContain(mockNewUser1.password);
  expect(dbUser.passwordHash).not.toContain(mockNewUser1.password);

  // Antar studentmail om inget annat ges
  expect(dbUser.email).toStrictEqual(`${mockNewUser1.username}@student.lu.se`);
});

test('create new valid user with email', async () => {
  const localMu = { email: 'mrcool@apkollen.se', ...mockNewUser1 };

  const resDbUser = await api.createUser(localMu);
  const dbUser = await api.getSingleUser(localMu.username);

  // dbUser will contain some null values
  expect(dbUser).toMatchObject(resDbUser);
  expect(dbUser.passwordSalt).not.toContain(localMu.password);
  expect(dbUser.passwordHash).not.toContain(localMu.password);

  // Antar studentmail om inget annat ges
  expect(dbUser.email).toStrictEqual(localMu.email);
});

test('create new user with empty username', async () => {
  const localMu = { ...mockNewUser1 };
  localMu.username = '';

  await expect(api.createUser(localMu)).rejects.toThrowError(BadRequestError);
  await expect(api.getSingleUser(localMu.username)).rejects.toThrowError(NotFoundError);
});

test('create a new user with invalid password', async () => {
  const localMu: NewUser = { ...mockNewUser1, password: '' };

  await expect(api.createUser(localMu)).rejects.toThrowError(BadRequestError);
  await expect(api.getSingleUser(localMu.username)).rejects.toThrowError(NotFoundError);
});

test('creating duplicate user fails', async () => {
  await expect(api.createUser(mockNewUser0)).rejects.toThrowError();
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

test('login with invalid username', async () => {
  await expect(api.loginUser('blennstersmamma', mockNewUser0.password)).rejects.toThrowError(
    NotFoundError,
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
  const uu: Partial<PrismaUser> = {
    firstName: 'Adolf',
    phone: '1234657890',
    address: 'Kämnärsvägen 22F',
    zipCode: '22645',
    website: 'apkollen.se',
  };

  await api.createUser(mockNewUser1);
  const dbRes = await api.getSingleUser(mockNewUser1.username);

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
  await expect(api.updateUser('Obv. fake username', { firstName: 'Adolf' })).rejects.toThrowError();
});

test('search for users by username that exists', async () => {
  // Generate a username that shares the first 2 letters
  const sharedUsername = `${mockNewUser0.username.substring(0, 2)}${mockNewUser1.username.substring(
    2,
  )}`;
  const mockUsr: NewUser = { ...mockNewUser1, username: sharedUsername };
  await api.createUser(mockUsr);

  expect((await api.searchUser('nouserhasthis'))).toHaveLength(0);
  expect((await api.searchUser(mockNewUser0.username))).toHaveLength(1);
  expect((await api.searchUser(`${mockNewUser0.username} nouserhasthis`))).toHaveLength(0);
  expect((await api.searchUser(mockNewUser0.username.toUpperCase()))).toHaveLength(1);

  expect((await api.searchUser(sharedUsername.substring(0, 2))).length).not.toBeLessThan(2); // We can have more matches from other tests
  await api.deleteUser(sharedUsername);
});

test('search for user by name that exists', async () => {
  expect((await api.searchUser(mockNewUser0.username))).toHaveLength(1);
  expect((await api.searchUser(mockNewUser0.firstName))).toHaveLength(1);
  expect((await api.searchUser(mockNewUser0.lastName))).toHaveLength(1);
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

test('getting number of members', async () => {
  // Svårtestat då users skrivs och tas bort från DB konstant under tester
  const numberOfMembers = await api.getNumberOfMembers();

  // Det borde iaf vara större eller lika med antalet seeded users
  expect(numberOfMembers).toBeGreaterThanOrEqual(3);
});

describe('login providers', () => {
  beforeAll(async () => {
    await api.createUser(mockNewUser1);
  });

  const testProvider1: Omit<LoginProvider, 'id'> = {
    provider: 'google',
    token: 'username',
    email: 'email@example.com',
  };

  const testProvider2: Omit<LoginProvider, 'id'> = {
    provider: 'facebook',
    token: 'zuckyzucky9000',
    email: 'email@me.com',
  };

  it('can link and unlink a new provider', async () => {
    const provider = await api.linkLoginProvider(
      mockNewUser1.username,
      testProvider1.provider as LoginProviderType,
      testProvider1.token,
      testProvider1.email ?? undefined,
    );

    expect(provider).not.toBeNull();

    const providers = await api.getLoginProviders(mockNewUser1.username);
    expect(providers).toHaveLength(1);

    await expect(api.unlinkLoginProvider(provider.id, mockNewUser1.username)).resolves.toBeTruthy();
  });

  it('can get a user from the provider', async () => {
    const provider = await api.linkLoginProvider(
      mockNewUser0.username,
      testProvider2.provider as LoginProviderType,
      testProvider2.token,
      testProvider2.email ?? undefined,
    );

    expect(provider).not.toBeNull();

    const user = await api.getUserFromProvider(
      provider.token,
      provider.provider,
      provider.email ?? undefined,
    );

    expect(user).not.toBeNull();

    await expect(
      api.getUserFromProvider('not a token', 'not a provider', 'not an email'),
    ).rejects.toThrow();
  });
});
