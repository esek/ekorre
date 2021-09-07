import { User, NewUser } from '../../src/graphql.generated';
import { UserAPI } from '../../src/api/user.api';
import { userReduce } from '../../src/reducers/user.reducer';
import { USER_TABLE } from '../../src/api/constants';
import knex  from '../../src/api/knex';


// Använd knex från test-utils, inte som den importeras
// i produktionen
const api = new UserAPI();

// Primary key och isFuncUser sätts i tester
const newUser: Omit<NewUser, 'isFuncUser'> = {
  username: 'ci6969test-s',
  firstName: 'CI',
  lastName: 'McTest',
  class: 'E18',
  password: 'test',
};

const newFuncUser: NewUser = {
  username: 'funcUser_hej',
  firstName: '',
  lastName: '',
  class: 'E18',
  password: 'test',
  isFuncUser: true
};

/**
 * Tar bort user från USER_TABLE
*/
const removeUser = async (username: string) => {
  await knex(USER_TABLE).where({username}).delete();
};

const clearDb = () => {
  removeUser(newUser.username);
  removeUser(newFuncUser.username);
  removeUser('');
};

// Cleanup
beforeEach(clearDb);
afterAll(clearDb);

// Skapa user via api.createUser,
// kontrollera att getUser hittar skapade användaren
test('Test creation of new valid user', done => {
  const expectedUser: User = {
    ...newUser,
    email: `${newUser.username}@student.lu.se`,
    access: { doors: [], web: [] }, // TODO: Kanske default access?
    posts: [],
  };

  api.createUser(newUser).then(user => {
    expect(user).toStrictEqual(expectedUser);

    // Försäkra att användaren är i databasen, getSignleUser() testas
    // på annat håll
    api.getSingleUser(newUser.username).then(userFromDb => {
      expect(userFromDb).not.toBe(null);
      done();
    });
  });
});

test('Test creation of user with empty username', done => {
  api.createUser({ ...newUser, username: '' }).then(user => {
    expect(user).toBe(null); // TODO: Vad ska den faktiskt returnera?

    // Försäkra att användaren är i databasen, getSignleUser() testas
    // på annat håll
    api.getSingleUser(newUser.username).then(userFromDb => {
      expect(userFromDb).toBe(null);
      done();
    });
  });
});

test('Test creation of funcUser with proper name', done => {
  const expectedUser: User = {
    ...newFuncUser,
    email: 'no-reply@esek.se',
    access: { doors: [], web: [] }, // TODO: Kanske default access?
    posts: [],
  };

  api.createUser(newFuncUser).then(user => {
    expect(user).toStrictEqual(expectedUser);

    // Försäkra att användaren är i databasen, getSignleUser() testas
    // på annat håll
    api.getSingleUser(newFuncUser.username).then(userFromDb => {
      expect(userFromDb).not.toBe(null);
      done();
    });
  });
});

test('Test creation of funcUser with wrong name', done => {
  const expectedUser: User = {
    ...newFuncUser,
    email: 'no-reply@esek.se',
    access: { doors: [], web: [] }, // TODO: Kanske default access?
    posts: [],
  };

  api.createUser({ ...newFuncUser, username: 'hej' }).then(user => {

    // API:n bör lägga till funcUser_
    expect(user).toStrictEqual(expectedUser);

    // Försäkra att användaren är i databasen, getSignleUser() testas
    // på annat håll
    api.getSingleUser(newFuncUser.username).then(userFromDb => {
      expect(userFromDb).not.toBe(null);
      done();
    });
  });
});