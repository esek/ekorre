import axios from 'axios';
import { API_URL } from '../testvariables';

interface LoginResponse {
  data: {
    login: boolean,
    [key: string]: any
  }
}

const LOGIN_MUTATION = `
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)
  }
`;

test('Check login with correct credentials', () => {
  const data = {
    'query': LOGIN_MUTATION,
    'variables': {
      'username': 'aa0000bb-s',
      'password': 'test',
    },
  };
  return axios.post<LoginResponse>(API_URL, data).then(res => {
    if (res.data !== null) {
      expect(res.data.data.login).toBeTruthy();
    } else {
      fail('Did not get proper response from the server');
    }
  });
});

test('Check login with incorrect credentials', () => {
  const data = {
    'query': LOGIN_MUTATION,
    'variables': {
      'username': 'En riktig fuling',
      'password': 'hunter2',
    },
  };
  return axios.post<LoginResponse>(API_URL, data).then(res => {
    if (res.data !== null) {
      expect(res.data.data.login).toBeFalsy();
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
  return axios.post<LoginResponse>(API_URL, data).then(res => {
    if (res.data !== null) {
      expect(res.data.data.login).toBeFalsy();
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
  return axios.post<LoginResponse>(API_URL, data).then(res => {
    if (res.data !== null) {
      expect(res.data.data.login).toBeFalsy();
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
  return axios.post<LoginResponse>(API_URL, data).then(res => {
    if (res.data !== null) {
      expect(res.data.data.login).toBeFalsy();
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
  return axios.post<LoginResponse>(API_URL, data).then(res => {
    if (res.data !== null) {
      expect(res.data.data.login).toBeFalsy();
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
  return axios.post<LoginResponse>(API_URL, data).then(res => {
    if (res.data !== null) {
      expect(res.data.data.login).toBeFalsy();
    } else {
      fail('Did not get proper response from the server');
    }
  });
});