import { userReduce } from '@/reducers/user.reducer';
import { User } from '@generated/graphql';
import { PrismaUser } from '@prisma/client';

const dummyDbUser: PrismaUser = {
  username: 'kk6969öö-s',
  // Pass är salt
  passwordHash:
    'Y8IUptOZ0LI3sUUP6JVNtOZiNaIblxTTXBIJ4JIBFzr/PZgFoGHM0ua7hVFCb3yFSlyV/DI0/G/br7cU9qG4Ag==',
  passwordSalt: 'Z1w2IPe1l9nCKwWM6RV+PA==',
  firstName: 'Kalle',
  lastName: 'Testballe',
  email: 'no-reply@esek.se',
  class: 'E18',
  address: 'Testgatan 1',
  zipCode: '12345',
  phone: null,
  dateJoined: new Date('1999-03-13'),
  photoUrl: null,
  website: null,
  luCard: null,
};

test('that password is reduced properly', () => {
  const compare: User = {
    username: 'kk6969öö-s',
    firstName: 'Kalle',
    lastName: 'Testballe',
    fullName: '', // This will get evaled in resolver
    email: 'no-reply@esek.se',
    class: 'E18',
    photoUrl: null,
    address: 'Testgatan 1',
    zipCode: '12345',
    phone: null,
    website: null,
    access: {
      features: [],
      doors: [],
    },
    posts: [],
    postHistory: [],
    wikiEdits: 0,
    emergencyContacts: [],
    loginProviders: [],
    luCard: null,
    verified: false,
  };

  expect(userReduce(dummyDbUser)).toStrictEqual(compare);
});
