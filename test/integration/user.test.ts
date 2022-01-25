import apolloServerConfig from '@/app/serverconfig';
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

test('getting user', async () => {
  const userResponse = await apolloServer.executeOperation({
    query: USER_QUERY,
    variables: {
      username: 'no0000oh-s', // Used in dev database
    },
  });

  expect(userResponse.errors).toBeUndefined();
  expect(userResponse?.data?.user).toMatchObject({
    firstName: 'Lena',
    lastName: 'Handén',
    email: 'aa0000bb-s@student.lu.se',
    class: 'BME19',
  });
});
