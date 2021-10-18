import axios, { AxiosRequestConfig } from 'axios';

import { ApiRequest } from '../models/test';
import { AXIOS_CONFIG } from '../utils/axiosConfig';
import { extractToken } from '../utils/utils';

import { COOKIES } from '../../src/auth';
import { User } from '../../src/graphql.generated';

interface LoginResponse {
  headers: {
    'set-cookie': string[] | undefined;
    [key: string]: any;
  };
  data: {
    data: {
      login: boolean;
      [key: string]: any;
    };
  };
}

interface RefreshResponse {
  headers: {
    'set-cookie': string[] | undefined;
  };
  data: {
    data: {
      refreshToken: User;
    };
  };
}


const LOGIN_MUTATION = `
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)
  }
`;

const REFRESH_TOKEN_QUERY = `
  {
    refreshToken {
      firstName
      username
    }
  }
`;

test('login with correct credentials', () => {
  const data = {
    query: LOGIN_MUTATION,
    variables: {
      username: 'aa0000bb-s',
      password: 'test',
    },
  };

  const axiosInstance = axios.create(AXIOS_CONFIG);

  return axiosInstance.post<ApiRequest, LoginResponse>('/', data).then((res) => {
    if (res.data !== null && res.headers !== null) {
      expect(res.data.data.login).toBeTruthy();
      if (res.headers['set-cookie'] === undefined) {
        fail('Response cookies undefined');
      }
      expect(extractToken(COOKIES.refreshToken, res.headers['set-cookie'][0])).not.toBe(null);
    } else {
      fail('Did not get proper response from the server');
    }
  });
});

/**
 * Med callbacks på detta sättet måste vi ha done som avgör när allt är klart,
 * i vanliga fall kan man bara returnera en promise (testet är klart när
 * promise är klart)
 */
test('authorization with COOKIES.refreshToken', (done) => {
  const loginData = {
    query: LOGIN_MUTATION,
    variables: {
      username: 'bb1111cc-s',
      password: 'test',
    },
  };

  const axiosInstance = axios.create(AXIOS_CONFIG);

  axiosInstance.post<ApiRequest, LoginResponse>('/', loginData).then((res) => {
    if (res.data !== null && res.headers !== null) {
      if (res.headers['set-cookie'] === undefined) {
        fail('Response cookies undefined');
      }

      const refreshToken = extractToken(COOKIES.refreshToken, res.headers['set-cookie'][0]);
      expect(refreshToken).not.toBeNull();

      // Vi ska nu testa om vi kan authorisera oss med token som vi fått
      // och få en accessToken
      const authData = {
        query: REFRESH_TOKEN_QUERY,
      };

      // Add refresh token to headers
      const authHeader: AxiosRequestConfig = {
        headers: {
          Cookie: `${COOKIES.refreshToken}=${refreshToken ?? ''}`
        }
      };

      axiosInstance
        .post<ApiRequest, RefreshResponse>('/', authData, authHeader)
        .then((res2) => {
          if (res2.data !== null && res2.headers !== null) {
            const accessToken = extractToken(COOKIES.accessToken, (res2.headers['set-cookie'] ?? [])[0]);
            expect(accessToken).not.toBeNull();
            expect(res2.data.data.refreshToken).not.toBeNull();
            expect(res2.data.data.refreshToken.username).toStrictEqual('bb1111cc-s');
            done();
          } else {
            fail('Did not get proper response from the server on second request');
          }
        });
    } else {
      fail('Did not get proper response from the server');
    }
  });
}, 7500);

test('refresh with incorrect refreshToken', (done) => {
  const authData = {
    query: REFRESH_TOKEN_QUERY,
  };

  // Add refresh token to headers
  const authHeader: AxiosRequestConfig = {
    headers: {
      Cookie: `${COOKIES.refreshToken}=bedragare@esek.se`
    }
  };

  const axiosInstance = axios.create(AXIOS_CONFIG);

  axiosInstance
    .post<ApiRequest, RefreshResponse>('/', authData, authHeader)
    .then((res) => {
      if (res.data !== null && res.headers !== null) {
        const accessToken = extractToken(COOKIES.accessToken, (res.headers['set-cookie'] ?? [])[0]);
        expect(accessToken).toBeNull();
        expect(res.data.data.refreshToken).toBeNull();
        done();
      } else {
        throw new Error('Did not get proper response from the server on second request');
      }
    });
});

test('login with incorrect credentials', () => {
  const data = {
    query: LOGIN_MUTATION,
    variables: {
      username: 'En riktig fuling',
      password: 'hunter2',
    },
  };

  const axiosInstance = axios.create(AXIOS_CONFIG);

  return axiosInstance.post<ApiRequest, LoginResponse>('/', data).then((res) => {
    if (res.data !== null && res.headers !== null) {
      expect(res.data.data.login).toBeFalsy();
      expect(res.headers['set-cookie']).toBe(undefined);
    } else {
      fail('Did not get proper response from the server');
    }
  });
});

test('login with incorrect password', () => {
  const data = {
    query: LOGIN_MUTATION,
    variables: {
      username: 'aa0000bb-s',
      password: 'inte test',
    },
  };

  const axiosInstance = axios.create(AXIOS_CONFIG);

  return axiosInstance.post<ApiRequest, LoginResponse>('/', data).then((res) => {
    if (res.data !== null && res.headers !== null) {
      expect(res.data.data.login).toBeFalsy();
      expect(res.headers['set-cookie']).toBe(undefined);
    } else {
      fail('Did not get proper response from the server');
    }
  });
});

test('login with incorrect username', () => {
  const data = {
    query: LOGIN_MUTATION,
    variables: {
      username: 'En h4ckerm4n',
      password: 'test',
    },
  };

  const axiosInstance = axios.create(AXIOS_CONFIG);

  return axiosInstance.post<ApiRequest, LoginResponse>('/', data).then((res) => {
    if (res.data !== null && res.headers !== null) {
      expect(res.data.data.login).toBeFalsy();
      expect(res.headers['set-cookie']).toBe(undefined);
    } else {
      fail('Did not get proper response from the server');
    }
  });
});

test('login with empty credentials', () => {
  const data = {
    query: LOGIN_MUTATION,
    variables: {
      username: '',
      password: '',
    },
  };

  const axiosInstance = axios.create(AXIOS_CONFIG);

  return axiosInstance.post<ApiRequest, LoginResponse>('/', data).then((res) => {
    if (res.data !== null && res.headers !== null) {
      expect(res.data.data.login).toBeFalsy();
      expect(res.headers['set-cookie']).toBe(undefined);
    } else {
      fail('Did not get proper response from the server');
    }
  });
});

test('login with empty password', () => {
  const data = {
    query: LOGIN_MUTATION,
    variables: {
      username: 'aa0000bb-s',
      password: '',
    },
  };

  const axiosInstance = axios.create(AXIOS_CONFIG);

  return axiosInstance.post<ApiRequest, LoginResponse>('/', data).then((res) => {
    if (res.data !== null && res.headers !== null) {
      expect(res.data.data.login).toBeFalsy();
      expect(res.headers['set-cookie']).toBe(undefined);
    } else {
      fail('Did not get proper response from the server');
    }
  });
});

test('login with empty username', () => {
  const data = {
    query: LOGIN_MUTATION,
    variables: {
      username: '',
      password: 'test',
    },
  };

  const axiosInstance = axios.create(AXIOS_CONFIG);

  return axiosInstance.post<ApiRequest, LoginResponse>('/', data).then((res) => {
    if (res.data !== null && res.headers !== null) {
      expect(res.data.data.login).toBeFalsy();
      expect(res.headers['set-cookie']).toBe(undefined);
    } else {
      fail('Did not get proper response from the server');
    }
  });
});
