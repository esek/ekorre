import { MeetingAPI } from '@/api/meeting.api';
import prisma from '@/api/prisma';
import { BadRequestError, NotFoundError, ServerError } from '@/errors/request.errors';
import { AccessType, FileType, MeetingDocumentType, MeetingType } from '@generated/graphql';
import { PrismaFile } from '@prisma/client';
import { genRandomUser } from '@test/utils/utils';

const [createDummyUser, deleteDummyUser] = genRandomUser([]);

const api = new MeetingAPI();

// Vi behöver en fejkfil p.g.a. FOREIGN KEY CONSTRAINT
const DUMMY_FILE: PrismaFile = {
  id: 'meetingFile0',
  refUploader: '', // Is changed in beforeAll()
  name: 'Kvittoförstärkning för sista måltiden',
  type: FileType.Image,
  folderLocation: '',
  accessType: AccessType.Public,
  createdAt: new Date(),
};

const DUMMY_PRIVATE_FILE: PrismaFile = {
  ...DUMMY_FILE,
  id: 'meetingFile1',
  accessType: AccessType.Admin,
};

beforeEach(async () => {
  await api.clear();
});

beforeAll(async () => {
  const { username } = await createDummyUser();
  DUMMY_FILE.refUploader = username;
  DUMMY_PRIVATE_FILE.refUploader = username;
  await Promise.all([
    prisma.prismaFile.create({ data: DUMMY_FILE }),
    prisma.prismaFile.create({ data: DUMMY_PRIVATE_FILE }),
  ]);
});

afterAll(async () => {
  await api.clear();
  await Promise.all([
    prisma.prismaFile.delete({ where: { id: DUMMY_FILE.id } }),
    prisma.prismaFile.delete({ where: { id: DUMMY_PRIVATE_FILE.id } }),
    deleteDummyUser(),
  ]);
});

test('creating valid VTM/HTM/VM specifying year but not number', async () => {
  const success = await api.createMeeting(MeetingType.Vtm, undefined, 2008);
  expect(success).toBeTruthy();

  // Vi behöver inte bry oss om år, det där är det enda
  const res = await api.getAllMeetings();
  expect(res.length).toBe(1);
  expect(res[0]).toMatchObject({
    type: MeetingType.Vtm,
    number: 1,
    year: 2008,
    refSummons: null,
    refDocuments: null,
    refLateDocuments: null,
    refProtocol: null,
  });
});

test('creating valid VTM/HTM/VM specifying number but not year', async () => {
  const success = await api.createMeeting(MeetingType.Htm, 3, undefined);
  expect(success).toBeTruthy();

  // Vi behöver inte bry oss om år, det där är det enda
  const res = await api.getAllMeetings();
  expect(res.length).toBe(1);
  expect(res[0]).toMatchObject({
    type: MeetingType.Htm,
    number: 3,
    year: new Date().getFullYear(),
    refSummons: null,
    refDocuments: null,
    refLateDocuments: null,
    refProtocol: null,
  });
});

test('deleting meeting', async () => {
  await api.createMeeting(MeetingType.Htm, 3, undefined);

  // Vi behöver inte bry oss om år, det där är det enda
  const meeting = (await api.getAllMeetings())[0];
  expect(await api.removeMeeting(meeting.id)).toBeTruthy();
});

test('deleting non-existant meeting', async () => {
  // ID does not matter, the database is empty
  await expect(api.removeMeeting(1)).rejects.toThrowError(NotFoundError);
});

test('creating two concurrent board meetings', async () => {
  await api.createMeeting(MeetingType.Sm, 1, 2021);
  await api.createMeeting(MeetingType.Sm, 4, 2021);
  await api.createMeeting(MeetingType.Sm, undefined, 2021);
  const lastMeetings = await api.getLatestBoardMeetings(1);
  expect(lastMeetings.length).toBe(1);
  expect(lastMeetings[0]).toMatchObject({
    type: MeetingType.Sm,
    number: 5,
    year: 2021,
    refSummons: null,
    refDocuments: null,
    refLateDocuments: null,
    refProtocol: null,
  });
});

test('creating duplicate meeting fails', async () => {
  await api.createMeeting(MeetingType.Sm, 1, 2021);
  await expect(api.createMeeting(MeetingType.Sm, 1, 2021)).rejects.toThrowError(
    new BadRequestError('Mötet finns redan!'),
  );
});

test('getting single meeting', async () => {
  await api.createMeeting(MeetingType.Extra, 1, 2021);
  const allMeetings = await api.getAllMeetings();
  expect(await api.getSingleMeeting(allMeetings[0].id)).toMatchObject({
    type: MeetingType.Extra,
    number: 1,
    year: 2021,
  });
});

test('get multiple meetings', async () => {
  await api.createMeeting(MeetingType.Vm, 4, 1667);
  await api.createMeeting(MeetingType.Sm, undefined, 2021);
  await api.createMeeting(MeetingType.Htm, 1, 1999);
  await api.createMeeting(MeetingType.Sm, 5, 1667);

  const m = await api.getMultipleMeetings(undefined, 5, MeetingType.Sm);

  expect(m.length).toBe(1);
  expect(m[0]).toMatchObject({
    type: MeetingType.Sm,
    number: 5,
    year: 1667,
  });
});

test('finding non-existant meeting', async () => {
  await expect(api.getSingleMeeting(-1337)).rejects.toThrowError(
    new NotFoundError('Mötet kunde inte hittas'),
  );
});

test('finding multiple non-existant meetings', async () => {
  await expect(api.getMultipleMeetings(0, 5000, MeetingType.Sm)).resolves.toHaveLength(0);
});

test('adding file to meeting', async () => {
  await api.createMeeting(MeetingType.Extra, 1, 2021);
  const { id } = (await api.getAllMeetings())[0];

  await expect(
    api.addFileToMeeting(id, DUMMY_FILE.id, MeetingDocumentType.Summons),
  ).resolves.toBeTruthy();

  const { refSummons } = await api.getSingleMeeting(id);
  expect(refSummons).toStrictEqual(DUMMY_FILE.id);
});

test('adding duplicate file to meeting', async () => {
  await api.createMeeting(MeetingType.Sm, 1, 2021);
  const { id } = (await api.getAllMeetings())[0];
  await api.addFileToMeeting(id, DUMMY_FILE.id, MeetingDocumentType.Protocol);
  await expect(
    api.addFileToMeeting(id, DUMMY_FILE.id, MeetingDocumentType.Protocol),
  ).rejects.toThrowError(BadRequestError);
});

test('adding private file to meeting', async () => {
  await api.createMeeting(MeetingType.Sm, 1, 2021);
  const { id } = (await api.getAllMeetings())[0];
  await expect(
    api.addFileToMeeting(id, DUMMY_PRIVATE_FILE.id, MeetingDocumentType.Protocol),
  ).rejects.toThrowError(BadRequestError);
});

test('removing document from meeting', async () => {
  await api.createMeeting(MeetingType.Extra, 1, 2021);
  const { id } = (await api.getAllMeetings())[0];
  await api.addFileToMeeting(id, DUMMY_FILE.id, MeetingDocumentType.Summons);
  expect((await api.getSingleMeeting(id)).refSummons).toStrictEqual(DUMMY_FILE.id);

  // Remove it again
  await expect(api.removeFileFromMeeting(id, MeetingDocumentType.Summons)).resolves.toBeTruthy();
  expect((await api.getSingleMeeting(id)).refSummons).toBeNull();
});

test('removing non-existant document', async () => {
  await api.createMeeting(MeetingType.Extra, 1, 2021);
  const { id } = (await api.getAllMeetings())[0];
  await expect(api.removeFileFromMeeting(id, MeetingDocumentType.Protocol)).resolves.toBeTruthy();
});

test('removing file from non-existant meeting', async () => {
  // Vilket ID som helst fungerar, databasen ska vara tom just nu
  await expect(
    api.removeFileFromMeeting(420, MeetingDocumentType.LateDocuments),
  ).rejects.toThrowError(ServerError);
});
