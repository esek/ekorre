import { COOKIES } from '@/auth';
import { NOOP } from '@/models/base';
import { AccessAPI } from '@api/access';
import { PrismaUser } from '@prisma/client';
import { ApiRequest, GraphqlResponse } from '@test/models/test';
import { AXIOS_CONFIG } from '@test/utils/axiosConfig';
import { USER_WITH_ACCESS_QUERY, LOGIN_MUTATION, LOGOUT_MUTATION } from '@test/utils/queries';
import { extractToken, genRandomUser } from '@test/utils/utils';
import axios, { AxiosRequestConfig } from 'axios';

const accessApi = new AccessAPI();

let mockUser: PrismaUser;
let mockUserPassword: string;
let removeUser: NOOP;

type LogoutResponse = {
  logout: boolean;
};

beforeAll(async () => {
  const [create, remove, password] = genRandomUser();
  mockUser = await create();
  mockUserPassword = password;
  removeUser = remove;
});

beforeEach(async () => {
  await accessApi.clearAccessForUser(mockUser.username);
});

afterAll(async () => {
  await accessApi.clearAccessForUser(mockUser.username);
  await removeUser();
});

describe('logging in and out', () => {
  const axiosInstance = axios.create(AXIOS_CONFIG);

  let accessToken: string | null = null;
  let authHeader: AxiosRequestConfig;
  let queryData: Record<string, unknown>;

  it('should log in', async () => {
    const loginData = {
      query: LOGIN_MUTATION,
      variables: {
        username: mockUser.username,
        password: mockUserPassword,
      },
    };

    await axiosInstance.post<ApiRequest, GraphqlResponse>('/', loginData).then((res) => {
      accessToken = extractToken(COOKIES.accessToken, res.headers['set-cookie']?.[1]);
      expect(accessToken).not.toBeNull();
    });
  });

  it('setup variables', () => {
    authHeader = {
      headers: {
        Cookie: `${COOKIES.accessToken}=${accessToken ?? ''}`,
      },
    };

    queryData = {
      query: USER_WITH_ACCESS_QUERY,
      variables: {
        username: mockUser.username,
      },
    };
  });

  it('should allow access', async () => {
    await axiosInstance
      .post<ApiRequest, GraphqlResponse>('/', queryData, authHeader)
      .then((res) => {
        expect(res.data.errors).toBeUndefined();
      });
  });

  // try mutation again with credentials
  it('should logout', async () => {
    const logoutData = {
      query: LOGOUT_MUTATION,
    };

    await axiosInstance
      .post<ApiRequest, GraphqlResponse<LogoutResponse>>('/', logoutData, authHeader)
      .then((res) => {
        expect(res.data.data.logout).toBe(true);
        const accessToken1 = extractToken(COOKIES.accessToken, res.headers['set-cookie']?.[1]);
        expect(accessToken1).toBeNull();
      });
  });

  it('should not allow access', async () => {
    await axiosInstance
      .post<ApiRequest, GraphqlResponse>('/', queryData, authHeader)
      .then((res) => {
        expect(res.data.errors).toBeDefined();
      });
  });
});
