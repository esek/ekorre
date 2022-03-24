import { COOKIES } from '@/auth';
import { AccessAPI } from '@api/access';
import { AccessInput, Feature } from '@generated/graphql';
import { ApiRequest, GraphqlResponse } from '@test/models/test';
import { AXIOS_CONFIG } from '@test/utils/axiosConfig';
import { extractToken } from '@test/utils/utils';
import axios, { AxiosRequestConfig } from 'axios';

const accessApi = new AccessAPI();

const LOGIN_MUTATION = `
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      username
      firstName
      lastName
    }
  }
`;

const LOGOUT_MUTATION = `
mutation {
	logout
}`;

type LogoutResponse = {
  logout: boolean;
};

const emptyAccess: AccessInput = { features: [], doors: [] };

beforeEach(async () => {
  await accessApi.setIndividualAccess('aa0000bb-s', emptyAccess);
});

afterAll(async () => {
  await accessApi.setIndividualAccess('aa0000bb-s', emptyAccess);
});

test('resource with only auth required', async () => {
  const axiosInstance = axios.create(AXIOS_CONFIG);

  const loginData = {
    query: LOGIN_MUTATION,
    variables: {
      username: 'aa0000bb-s',
      password: 'test',
    },
  };

  const logoutData = {
    query: LOGOUT_MUTATION,
  };

  // try without auth
  await expect(
    axiosInstance
      .post<ApiRequest, GraphqlResponse<LogoutResponse>>('/', logoutData)
      .then((res) => res.data.data.logout),
  ).resolves.toBe(true);

  // try to call without auth, (should throw error)
  await axiosInstance
    .post<ApiRequest, GraphqlResponse<LogoutResponse>>('/', logoutData)
    .then((res) => {
      expect(res.data.data.logout).toBeNull();
      expect(res.data.errors?.length).toBeGreaterThan(0);
    });

  // login
  await axiosInstance.post<ApiRequest, GraphqlResponse>('/', loginData).then(async (res) => {
    const accessToken = extractToken(COOKIES.accessToken, res.headers['set-cookie']?.[1]);
    expect(accessToken).not.toBeNull();

    const authHeader: AxiosRequestConfig = {
      headers: {
        Cookie: `${COOKIES.accessToken}=${accessToken ?? ''}`,
      },
    };

    // try mutation again with credentials
    await expect(
      axiosInstance
        .post<ApiRequest, GraphqlResponse<LogoutResponse>>('/', logoutData, authHeader)
        .then((res2) => res2.data.data.logout),
    ).resolves.toBe(true);
  });
});

test('resource with mapping', async () => {
  const axiosInstance = axios.create(AXIOS_CONFIG);
  const username = 'aa0000bb-s';

  const loginData = {
    query: LOGIN_MUTATION,
    variables: {
      username,
      password: 'test',
    },
  };

  const logoutData = {
    query: LOGOUT_MUTATION,
  };

  // try without auth
  await expect(
    axiosInstance
      .post<ApiRequest, GraphqlResponse<LogoutResponse>>('/', logoutData)
      .then((res) => res.data.data.logout),
  ).resolves.toBe(true);

  // try to call without auth, (should throw error)
  await axiosInstance
    .post<ApiRequest, GraphqlResponse<LogoutResponse>>('/', logoutData)
    .then((res) => {
      expect(res.data.data.logout).toBeNull();
      expect(res.data.errors?.length).toBeGreaterThan(0);
    });

  // login
  await axiosInstance
    .post<ApiRequest, GraphqlResponse<LogoutResponse>>('/', loginData)
    .then(async (res) => {
      const accessToken = extractToken(COOKIES.accessToken, res.headers['set-cookie']?.[1]);
      expect(accessToken).not.toBeNull();

      const authHeader: AxiosRequestConfig = {
        headers: {
          Cookie: `${COOKIES.accessToken}=${accessToken ?? ''}`,
        },
      };

      // try mutation again with only auth (should throw)
      await axiosInstance
        .post<ApiRequest, GraphqlResponse<LogoutResponse>>('/', logoutData, authHeader)
        .then((res2) => {
          expect(res2.data.data.logout).toBeNull();
          expect(res2.data.errors?.length).toBeGreaterThan(0);
        });

      // give user access to resource
      await accessApi.setIndividualAccess(username, { features: [Feature.AccessAdmin], doors: [] });

      // aaaaand again
      await expect(
        axiosInstance
          .post<ApiRequest, GraphqlResponse<LogoutResponse>>('/', logoutData, authHeader)
          .then((res3) => res3.data.data.logout),
      ).resolves.toBe(true);
    });
});
