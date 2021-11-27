import axios, { AxiosRequestConfig } from 'axios';

import { AccessAPI } from '../../src/api/access.api';
import ResourcesAPI from '../../src/api/accessresources.api';
import { COOKIES } from '../../src/auth';
import { AccessResource, AccessResourceType, ResolverType } from '../../src/graphql.generated';
import { ApiRequest, GraphqlResponse } from '../models/test';
import { AXIOS_CONFIG } from '../utils/axiosConfig';
import { extractToken } from '../utils/utils';

const accessApi = new AccessAPI();
const resourcesApi = new ResourcesAPI();

const testResource: AccessResource = {
  name: 'Test resource',
  slug: 'test-resource',
  description: '',
  resourceType: AccessResourceType.Web,
};

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

beforeAll(async () => {
  await resourcesApi.addResource(
    testResource.name,
    testResource.slug,
    testResource.description,
    testResource.resourceType,
  );
  await resourcesApi.addResource('', 'logout', '', AccessResourceType.Web);
  await resourcesApi.addResource('Empty resource', '', '', AccessResourceType.Web);
});

beforeEach(async () => {
  await accessApi.setAccessMappings('logout', ResolverType.Mutation);
  await accessApi.setIndividualAccess('aa0000bb-s', []);
});

afterAll(async () => {
  await accessApi.setAccessMappings('logout', ResolverType.Mutation, );
  await accessApi.setIndividualAccess('aa0000bb-s', []);
  await resourcesApi.removeResouce(testResource.slug);
  await resourcesApi.removeResouce('logout');
  await resourcesApi.removeResouce('');
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

  // add resource mapping
  await accessApi.setAccessMappings('logout', ResolverType.Mutation, ['']);

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

  // add resource mapping
  await accessApi.setAccessMappings('logout', ResolverType.Mutation, [testResource.slug]);

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
      await accessApi.setIndividualAccess(username, [testResource.slug]);

      // aaaaand again
      await expect(
        axiosInstance
          .post<ApiRequest, GraphqlResponse<LogoutResponse>>('/', logoutData, authHeader)
          .then((res3) => res3.data.data.logout),
      ).resolves.toBe(true);
    });
});
