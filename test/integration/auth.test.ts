import { app } from '@/app/app';
import { COOKIES, issueToken } from '@/auth';
import requestWithAuth from '@test/utils/requestWithAuth';
import request from 'supertest';

const TEST_EXISTING_USER = {
  username: 'aa0000bb-s',
  password: 'test',
};

describe('login', () => {
  const LOGIN_MUTATION = `
		mutation login ($username: String!, $password: String!) {
			login(username: $username, password: $password) {
				username
			}
		}
	`;
  it('can log a user in', async () => {
    const res = await requestWithAuth<{ username: string }>(LOGIN_MUTATION, TEST_EXISTING_USER, '');

    expect(res.errors).toBeUndefined();
    expect(res.data?.login?.username).toBe(TEST_EXISTING_USER.username);
  });

  it("throws if it can't log a user in", async () => {
    const res = await requestWithAuth<{ username: string }>(
      LOGIN_MUTATION,
      {
        username: TEST_EXISTING_USER.username,
        password: 'wrong-password',
      },
      '',
    );

    expect(res.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorType: 'UnauthenticatedError',
          message: 'Inloggningen misslyckades',
          statusCode: 401,
        }),
      ]),
    );
    expect(res.data?.login).toBeNull();
  });
});

describe('logout', () => {
  const LOGOUT_MUTATION = `
		mutation logout {
			logout
		}
	`;
  it('can log a user out', async () => {
    const token = issueToken(TEST_EXISTING_USER, 'accessToken');

    const res = await requestWithAuth<boolean>(LOGOUT_MUTATION, {}, token);

    expect(res.errors).toBeUndefined();
    expect(res.data?.logout).toBe(true);
  });
});

describe('refresh', () => {
  const r = request(app);

  it('can refresh a users token', async () => {
    const accessToken = issueToken(TEST_EXISTING_USER, 'accessToken');
    const refreshToken = issueToken(TEST_EXISTING_USER, 'refreshToken');

    const res = await r
      .post('/auth/refresh')
      .set('Cookie', [
        `${COOKIES.refreshToken}=${refreshToken}`,
        `${COOKIES.accessToken}=${accessToken}`,
      ]);

    expect(res.status).toBe(200);

    const { 'set-cookie': setCookie } = res.headers;

    expect(setCookie).toEqual(
      expect.arrayContaining([
        expect.stringContaining(COOKIES.accessToken),
        expect.stringContaining(COOKIES.refreshToken),
      ]),
    );
  });

  it("can't refresh the token of an unknown user", async () => {
    const accessToken = issueToken({ username: 'ba1111js-s' }, 'accessToken');
    const refreshToken = issueToken({ username: 'ba1111js-s' }, 'refreshToken');

    const res = await r
      .post('/auth/refresh')
      .set('Cookie', [
        `${COOKIES.refreshToken}=${refreshToken}`,
        `${COOKIES.accessToken}=${accessToken}`,
      ]);

    expect(res.status).toBe(401);
  });
});
