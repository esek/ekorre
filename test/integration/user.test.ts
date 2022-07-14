import apolloServerConfig from '@/app/serverconfig';
import { tokenProvider } from '@/auth';
import { NOOP } from '@/models/base';
import { PrismaUser } from '@prisma/client';
import requestWithAuth from '@test/utils/requestWithAuth';
import { genRandomUser } from '@test/utils/utils';
import { ApolloServer } from 'apollo-server-express';

const apolloServer = new ApolloServer(apolloServerConfig);

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

let mockUser: PrismaUser;
let removeMockUser: NOOP;

beforeAll(async () => {
  const [create, remove] = genRandomUser();
  mockUser = await create();
  removeMockUser = remove;
});

afterAll(async () => {
  await removeMockUser();
});

test('getting user when not logged in', async () => {
  const userResponse = await apolloServer.executeOperation({
    query: USER_QUERY,
    variables: {
      username: mockUser.username,
    },
  });

  expect(userResponse.errors).toBeDefined();
});

test('getting user', async () => {
  const token = tokenProvider.issueToken(mockUser.username, 'access_token');

  const userResponse = await requestWithAuth(
    USER_QUERY,
    {
      username: mockUser.username,
    },
    token,
  );

  expect(userResponse.errors).toBeUndefined();

  expect(userResponse?.data?.user).toMatchObject({
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    class: mockUser.class,
  });
});
