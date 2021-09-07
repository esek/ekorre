import { User, NewUser } from '../../src/graphql.generated';
import { UserAPI } from '../../src/api/user.api';
import knex from '../utils/knex';

// Använd knex från test-utils, inte som den importeras
// i produktionen
const api = new UserAPI();
console.log(api.knex);

// Primary key och isFuncUser sätts i tester
const partialNewUser: Omit<NewUser, 'username' | 'isFuncUser'> = {
  firstName: 'CI',
  lastName: 'McTest',
  class: 'E18',
  password: 'test',
};

// Skapa user via api.createUser,
// kontrollera att getUser hittar skapade användaren
test('Test creation of new valid user', done => {
  const localUsername = 'test0';
  const expectedUser: User = {
    ...partialNewUser,
    username: localUsername,
    email: `${localUsername}@student.lu.se`,
    access: { doors: [], web: [] }, // TODO: Kanske default access?
    posts: [],
  };
  const nu: NewUser = { username: localUsername, ...partialNewUser};

  api.createUser(nu).then(user => {
    expect(user).toStrictEqual(expectedUser);

    // Försäkra att användaren är i databasen, getSignleUser() testas
    // på annat håll
    api.getSingleUser(localUsername).then(userFromDb => {
      expect(userFromDb).toStrictEqual(expectedUser);
      done();
    })
      .catch(err => {
        expect(err).toBe(null);
      });
  })
    .catch((err) => {
      expect(err).toBe(null);
    });
});