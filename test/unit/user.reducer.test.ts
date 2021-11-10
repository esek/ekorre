import { User } from '../../src/graphql.generated';
import { DatabaseUser } from '../../src/models/db/user';
import { userReduce } from '../../src/reducers/user.reducer';

const dummyDbUser: DatabaseUser = {
  username: 'kk6969öö-s',
  // Pass är salt
  passwordHash:
    'Y8IUptOZ0LI3sUUP6JVNtOZiNaIblxTTXBIJ4JIBFzr/PZgFoGHM0ua7hVFCb3yFSlyV/DI0/G/br7cU9qG4Ag==',
  passwordSalt: 'Z1w2IPe1l9nCKwWM6RV+PA==',
  firstName: 'Kalle',
  lastName: 'Testballe',
  email: 'no-reply@esek.se',
  class: 'E18',
  isFuncUser: false,
};

test('that password is reduced properly', () => {
  expect(userReduce(dummyDbUser)).toStrictEqual({
    username: 'kk6969öö-s',
    firstName: 'Kalle',
    lastName: 'Testballe',
    email: 'no-reply@esek.se',
    class: 'E18',
    isFuncUser: false,
    photoUrl: null,
    access: {
      web: [],
      doors: [],
    },
    posts: [],
    userPostHistory: [],
  });
});
