import { RefreshResponse } from '../../src/graphql.generated';
import { ApiRequest } from '../models/test';
import { axiosInstance } from '../utils/axiosInstance';






interface LoginResponse {
  headers: {
    'set-cookie': string[] | undefined,
    [key: string]: any
  },
  data: {
    data: {
      login: boolean,
      [key: string]: any
    }
  },
}

interface FullRefreshResponse {
  headers: {
    'set-cookie': string[] | undefined
  },
  data: {
    data: RefreshResponse
  }
}

const LOGIN_MUTATION = `
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)
  }
`;

const REFRESH_TOKEN = `
  {
    refreshToken {
      user {
        name
        username
      }
    }
  }
`;

const extractRefreshToken = (s: string): string | null => {
  const match = /e-refresh-token=(.*?);/g.exec(s);
  if (match !== null) {
    return match[0];
  }
  return null;
};

test('Check login with correct credentials', () => {
  const data = {
    'query': LOGIN_MUTATION,
    'variables': {
      'username': 'aa0000bb-s',
      'password': 'test',
    },
  };
  return axiosInstance.post<ApiRequest, LoginResponse>('/', data).then(res => {
    if (res.data !== null && res.headers !== null) {
      expect(res.data.data.login).toBeTruthy();
      if (res.headers['set-cookie'] === undefined) {
        fail('Response cookies undefined');
      }
      expect(extractRefreshToken(res.headers['set-cookie'][0])).not.toBe(null);
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
test('Check authorization with e-refresh-cookie', (done) => {
  const loginData = {
    query: LOGIN_MUTATION,
    variables: {
      username: 'bb1111cc-s',
      password: 'test',
    },
  };
  axiosInstance.post<ApiRequest, LoginResponse>('/', loginData).then((res) => {
    if (res.data !== null && res.headers !== null) {
      if (res.headers['set-cookie'] === undefined) {
        fail('Response cookies undefined');
      }
      const refreshToken = extractRefreshToken(res.headers['set-cookie'][0]);
      if (refreshToken === null) {
        fail('Response cookies did not contain e-refresh token');
      }

      // Vi ska nu testa om vi kan authorisera oss med token som vi fått
      const authData = {
        query: REFRESH_TOKEN,
        headers: {
          Cookie: `e-refresh-token=${refreshToken}; `,
        },
      };
      axiosInstance.post<ApiRequest, FullRefreshResponse>('/', authData).then(res2 => {
        if (res2.data !== null && res2.headers !== null) {
          // REFRESH_TOKEN frågar bara om namn och användarnamn
          expect(res2.data.data.user).toStrictEqual({
            firstName: 'Leif',
            username: 'bb1111cc-s',
          });
          expect(res.data.data.accessToken).not.toBe(undefined);
        }
      });
      done();
    } else {
      fail('Did not get proper response from the server');
    }
  });
});

test('Check login with incorrect credentials', () => {
  const data = {
    query: LOGIN_MUTATION,
    variables: {
      username: 'En riktig fuling',
      password: 'hunter2',
    },
  };
  return axiosInstance.post<ApiRequest, LoginResponse>('/', data).then((res) => {
    if (res.data !== null && res.headers !== null) {
      expect(res.data.data.login).toBeFalsy();
      expect(res.headers['set-cookie']).toBe(undefined);
    } else {
      fail('Did not get proper response from the server');
    }
  });
});

test('Check login with incorrect password', () => {
  const data = {
    'query': LOGIN_MUTATION,
    'variables': {
      'username': 'aa0000bb-s',
      'password': 'inte test',
    },
  };
  return axiosInstance.post<ApiRequest, LoginResponse>('/', data).then(res => {
    if (res.data !== null && res.headers !== null) {
      expect(res.data.data.login).toBeFalsy();
      expect(res.headers['set-cookie']).toBe(undefined);
    } else {
      fail('Did not get proper response from the server');
    }
  });
});

test('Check login with incorrect username', () => {
  const data = {
    'query': LOGIN_MUTATION,
    'variables': {
      'username': 'En h4ckerm4n',
      'password': 'test',
    },
  };
  return axiosInstance.post<ApiRequest, LoginResponse>('/', data).then(res => {
    if (res.data !== null && res.headers !== null) {
      expect(res.data.data.login).toBeFalsy();
      expect(res.headers['set-cookie']).toBe(undefined);
    } else {
      fail('Did not get proper response from the server');
    }
  });
});

test('Check login with empty credentials', () => {
  const data = {
    'query': LOGIN_MUTATION,
    'variables': {
      'username': '',
      'password': '',
    },
  };
  return axiosInstance.post<ApiRequest, LoginResponse>('/', data).then(res => {
    if (res.data !== null && res.headers !== null) {
      expect(res.data.data.login).toBeFalsy();
      expect(res.headers['set-cookie']).toBe(undefined);
    } else {
      fail('Did not get proper response from the server');
    }
  });
});

test('Check login with empty password', () => {
  const data = {
    'query': LOGIN_MUTATION,
    'variables': {
      'username': 'aa0000bb-s',
      'password': '',
    },
  };
  return axiosInstance.post<ApiRequest, LoginResponse>('/', data).then(res => {
    if (res.data !== null && res.headers !== null) {
      expect(res.data.data.login).toBeFalsy();
      expect(res.headers['set-cookie']).toBe(undefined);
    } else {
      fail('Did not get proper response from the server');
    }
  });
});

test('Check login with empty username', () => {
  const data = {
    'query': LOGIN_MUTATION,
    'variables': {
      'username': '',
      'password': 'test',
    },
  };
  return axiosInstance.post<ApiRequest, LoginResponse>('/', data).then(res => {
    if (res.data !== null && res.headers !== null) {
      expect(res.data.data.login).toBeFalsy();
      expect(res.headers['set-cookie']).toBe(undefined);
    } else {
      fail('Did not get proper response from the server');
    }
  });
});