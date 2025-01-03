import { apolloServerConfig } from '@/app/serverconfig';
import tokenProvider from '@/auth';
import { NOOP } from '@/models/base';
import { UserAPI } from '@api/user';
import { ApolloServer } from '@apollo/server';
import { PrismaUser } from '@prisma/client';
import requestWithAuth from '@test/utils/requestWithAuth';
import { genRandomUser } from '@test/utils/utils';

const apolloServer = new ApolloServer(apolloServerConfig);
const api = new UserAPI();

const USER_QUERY = `
  query getUser($username: String!) {
    user(username: $username) {
      username
      firstName
      lastName
      photoUrl
      email
      phone
      zipCode
      website
      address
      class
    }
  }
`;

const USERS_QUERY = `
  query getUsers($usernames: [String!]!) {
    users(usernames: $usernames) {
      username
      firstName
      lastName
      photoUrl
      email
      phone
      zipCode
      website
      address
      class
    }
  }
`;

// Used for login
const loginInfo = {
  username: 'aa0000bb-s',
  password: 'test',
};

let mockUser1: PrismaUser;
let mockUser2: PrismaUser;
let removeMockUser1: NOOP;
let removeMockUser2: NOOP;

beforeAll(async () => {
  const [create1, remove1] = genRandomUser();
  mockUser1 = await create1();
  removeMockUser1 = remove1;

  const [create2, remove2] = genRandomUser();
  mockUser2 = await create2();
  removeMockUser2 = remove2;
});

afterAll(async () => {
  await removeMockUser1();
  await removeMockUser2();
});

test('getting user when not logged in', async () => {
  const userResponse = await apolloServer.executeOperation({
    query: USER_QUERY,
    variables: {
      username: mockUser1.username,
    },
  });

  expect(userResponse.errors).toBeDefined();
});

test('getting user', async () => {
  const token = tokenProvider.issueToken(mockUser1.username, 'access_token');

  const userResponse = await requestWithAuth(
    USER_QUERY,
    {
      username: mockUser1.username,
    },
    token,
  );

  expect(userResponse.errors).toBeUndefined();

  expect(userResponse?.data?.user).toMatchObject({
    firstName: mockUser1.firstName,
    lastName: mockUser1.lastName,
    class: mockUser1.class,
  });
});

test('getting several users', async () => {
  const user = await api.loginUser(loginInfo.username, loginInfo.password);
  const token = tokenProvider.issueToken(user.username, 'access_token');

  const userResponse = await requestWithAuth(
    USERS_QUERY,
    {
      usernames: [mockUser1.username, mockUser2.username],
    },
    token,
  );

  expect(userResponse.errors).toBeUndefined();

  expect(userResponse?.data).toMatchObject({
    users: [
      {
        firstName: mockUser1.firstName,
        lastName: mockUser1.lastName,
        class: mockUser1.class,
      },
      {
        firstName: mockUser2.firstName,
        lastName: mockUser2.lastName,
        class: mockUser2.class,
      },
    ],
  });
});
