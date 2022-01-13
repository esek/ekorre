import { ApolloServer } from 'apollo-server-express';
import { USER_TABLE } from '../../src/api/constants';
import db from '../../src/api/knex';
import { NewUser } from '../../src/graphql.generated';
import apolloServerConfig from '../../src/serverconfig';

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

test('get user', async () => {
  const userResponse = await apolloServer.executeOperation({
    query: USER_QUERY,
    variables: {
      username: 'no0000oh-s', // Used in dev database
    }
  });

  expect(userResponse.errors).toBeUndefined();
  expect(userResponse?.data?.user).toMatchObject({
    firstName: 'Lena',
    lastName: 'Handén',
    email: 'aa0000bb-s@student.lu.se',
    class: 'BME19',
  });
});