import { EMERGENCY_CONTACTS_TABLE, USER_TABLE } from '../../src/api/constants';
import EmergencyContactAPI from '../../src/api/emergencycontact.api';
import knexInstance from '../../src/api/knex';
import { UserAPI } from '../../src/api/user.api';
import { NotFoundError, ServerError } from '../../src/errors/RequestErrors';
import { EmergencyContact, EmergencyContactType, NewUser } from '../../src/graphql.generated';
import { DatabaseEmergencyContact } from '../../src/models/db/emergencycontact';
import { DatabaseUser } from '../../src/models/db/user';

const emergencyContactApi = new EmergencyContactAPI();
const userApi = new UserAPI();

const DUMMY_USER: NewUser = {
  username: 'testECApiTestUser',
  firstName: 'Adde',
  lastName: 'Heinrichson',
  class: 'E18',
  password: 'hunter2',
};

const DUMMMY_DAD: Omit<EmergencyContact, 'id'> = {
  name: 'John Doe',
  phone: '+49123456789',
  type: EmergencyContactType.Dad,
};

beforeAll(async () => {
  await userApi.createUser(DUMMY_USER);
});

afterAll(async () => {
  await knexInstance<DatabaseEmergencyContact>(EMERGENCY_CONTACTS_TABLE)
    .delete()
    .where('refuser', DUMMY_USER.username);
  await knexInstance<DatabaseUser>(USER_TABLE).delete().where('username', DUMMY_USER.username);
});

test('get empty emergency contacts for user', async () => {
  await expect(emergencyContactApi.getEmergencyContacts(DUMMY_USER.username)).resolves.toHaveLength(0);
});

test('add emergency contact to user that exists', async () => {
  await expect(
    emergencyContactApi.addEmergencyContact(
      DUMMY_USER.username,
      DUMMMY_DAD.name,
      DUMMMY_DAD.phone,
      DUMMMY_DAD.type,
    ),
  ).resolves.toBe(true);
});

test('add emergency contact to user that does not exist', async () => {
  await expect(
    emergencyContactApi.addEmergencyContact(
      'notExistingUser',
      DUMMMY_DAD.name,
      DUMMMY_DAD.phone,
      DUMMMY_DAD.type,
    ),
  ).rejects.toThrow(ServerError);
});

test('get all emergency contacts', async () => {
  await expect(emergencyContactApi.getEmergencyContacts(DUMMY_USER.username)).resolves.toHaveLength(
    1,
  );
});

test('remove emergency contact that does not exist', async () => {
  await expect(
    emergencyContactApi.removeEmergencyContact(DUMMY_USER.username, 99999),
  ).rejects.toThrow(ServerError);
});

test('remove emergency contact that does exist', async () => {
  // Get the ID of the user contact created
  const contacts = await emergencyContactApi.getEmergencyContacts(DUMMY_USER.username);
  const contact = contacts.find(
    (c) => c.refuser === DUMMY_USER.username && c.name === DUMMMY_DAD.name,
  );

  if (!contact) {
    throw new Error();
  }

  await expect(
    emergencyContactApi.removeEmergencyContact(DUMMY_USER.username, contact.id),
  ).resolves.toBe(true);

  await expect(emergencyContactApi.getEmergencyContacts(DUMMY_USER.username)).resolves.toHaveLength(0);
});
