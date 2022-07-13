import EmergencyContactAPI from '@/api/emergencycontact.api';
import prisma from '@/api/prisma';
import { ServerError } from '@/errors/request.errors';
import { EmergencyContact, EmergencyContactType, NewUser } from '@generated/graphql';
import { genRandomUser } from '@test/utils/utils';

const [createDummyUser, deleteDummyUser] = genRandomUser([]);

const emergencyContactApi = new EmergencyContactAPI();

const DUMMMY_DAD: Omit<EmergencyContact, 'id'> = {
  name: 'John Doe',
  phone: '+49123456789',
  type: EmergencyContactType.Dad,
};

const clearDb = async () => {
  try {
    await prisma.prismaEmergencyContact.deleteMany({
      where: {
        ...DUMMMY_DAD,
      },
    });
  } catch {
    // NOOP
  }

  try {
    await deleteDummyUser();
  } catch {
    // NOOP
  }
};

afterEach(async () => {
  await clearDb();
});

test('get empty emergency contacts for user', async () => {
  const dummyUser = await createDummyUser();
  await expect(emergencyContactApi.getEmergencyContacts(dummyUser.username)).resolves.toHaveLength(
    0,
  );
});

test('add emergency contact to user that exists', async () => {
  const dummyUser = await createDummyUser();
  await expect(
    emergencyContactApi.addEmergencyContact(
      dummyUser.username,
      DUMMMY_DAD.name,
      DUMMMY_DAD.phone,
      DUMMMY_DAD.type,
    ),
  ).resolves.toBeTruthy();
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
  const dummyUser = await createDummyUser();

  await emergencyContactApi.addEmergencyContact(
    dummyUser.username,
    DUMMMY_DAD.name,
    DUMMMY_DAD.phone,
    DUMMMY_DAD.type,
  );

  await expect(emergencyContactApi.getEmergencyContacts(dummyUser.username)).resolves.toHaveLength(
    1,
  );
});

test('remove emergency contact that does not exist', async () => {
  const dummyUser = await createDummyUser();
  await expect(
    emergencyContactApi.removeEmergencyContact(dummyUser.username, 99999),
  ).rejects.toThrow(ServerError);
});

test('remove emergency contact that does exist', async () => {
  const dummyUser = await createDummyUser();

  const { id: contactId } = await emergencyContactApi.addEmergencyContact(
    dummyUser.username,
    DUMMMY_DAD.name,
    DUMMMY_DAD.phone,
    DUMMMY_DAD.type,
  );

  await expect(
    emergencyContactApi.removeEmergencyContact(dummyUser.username, contactId),
  ).resolves.toBeTruthy();

  await expect(emergencyContactApi.getEmergencyContacts(dummyUser.username)).resolves.toHaveLength(
    0,
  );
});
