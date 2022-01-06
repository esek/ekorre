import { FILE_TABLE, MEETING_TABLE } from '../../src/api/constants';
import knexInstance from '../../src/api/knex';
import { MeetingAPI } from '../../src/api/meeting.api';
import { BadRequestError, NotFoundError, ServerError } from '../../src/errors/RequestErrors';
import {
  AccessType,
  FileType,
  MeetingDocumentType,
  MeetingType,
} from '../../src/graphql.generated';
import { DatabaseFile } from '../../src/models/db/file';
import { DatabaseMeeting } from '../../src/models/db/meeting';

const api = new MeetingAPI();

// Vi behöver en fejkfil p.g.a. FOREIGN KEY CONSTRAINT
const DUMMY_FILE: DatabaseFile = {
  id: 'meetingApiTestFile',
  refuploader: 'aa0000bb-s',
  name: 'Kvittoförstärkning för sista måltiden',
  type: FileType.Image,
  folderLocation: '',
  accessType: AccessType.Admin,
  createdAt: Date.now(),
};

beforeEach(async () => {
  // Delete all rows
  await knexInstance<DatabaseMeeting>(MEETING_TABLE).delete().where('id', '!=', 'null');
});

// Vi sparar databasen före och lägger tillbaka den efter
let dbBefore: DatabaseMeeting[];
beforeAll(async () => {
  dbBefore = await knexInstance<DatabaseMeeting>(MEETING_TABLE).select('*');
  await knexInstance<DatabaseFile>(FILE_TABLE).insert(DUMMY_FILE);
});

afterAll(async () => {
  await knexInstance<DatabaseMeeting>(MEETING_TABLE).delete().where('id', '!=', 'null');
  await knexInstance<DatabaseMeeting>(MEETING_TABLE).insert(dbBefore);
  await knexInstance<DatabaseFile>(FILE_TABLE).delete().where('id', DUMMY_FILE.id);
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
    refsummons: null,
    refdocuments: null,
    reflateDocuments: null,
    refprotocol: null,
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
    refsummons: null,
    refdocuments: null,
    reflateDocuments: null,
    refprotocol: null,
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
  await expect(api.removeMeeting('1')).rejects.toThrowError(NotFoundError);
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
    refsummons: null,
    refdocuments: null,
    reflateDocuments: null,
    refprotocol: null,
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

  const m = await api.getMultipleMeetings({ type: MeetingType.Sm, number: 5, year: undefined });
  expect(m.length).toBe(1);
  expect(m[0]).toMatchObject({
    type: MeetingType.Sm,
    number: 5,
    year: 1667,
  });
});

test('finding non-existant meeting', async () => {
  await expect(api.getSingleMeeting('trams som INTE är ett id')).rejects.toThrowError(
    new NotFoundError('Mötet kunde inte hittas'),
  );
});

test('finding multiple non-existant meetings', async () => {
  await expect(
    api.getMultipleMeetings({ type: MeetingType.Sm, number: 5000, year: 0 }),
  ).resolves.toHaveLength(0);
});

test('adding file to meeting', async () => {
  await api.createMeeting(MeetingType.Extra, 1, 2021);
  const { id } = (await api.getAllMeetings())[0];
  await expect(
    api.addFileToMeeting(id, DUMMY_FILE.id, MeetingDocumentType.Summons),
  ).resolves.toBeTruthy();
  const { refsummons } = await api.getSingleMeeting(id);
  expect(refsummons).toStrictEqual(DUMMY_FILE.id);
});

test('adding duplicate file to meeting', async () => {
  await api.createMeeting(MeetingType.Sm, 1, 2021);
  const { id } = (await api.getAllMeetings())[0];
  await api.addFileToMeeting(id, DUMMY_FILE.id, MeetingDocumentType.Protocol);
  await expect(
    api.addFileToMeeting(id, DUMMY_FILE.id, MeetingDocumentType.Protocol),
  ).rejects.toThrowError(ServerError);
});

test('removing document from meeting', async () => {
  await api.createMeeting(MeetingType.Extra, 1, 2021);
  const { id } = (await api.getAllMeetings())[0];
  await api.addFileToMeeting(id, DUMMY_FILE.id, MeetingDocumentType.Summons);
  expect((await api.getSingleMeeting(id)).refsummons).toStrictEqual(DUMMY_FILE.id);

  // Remove it again
  await expect(api.removeFileFromMeeting(id, MeetingDocumentType.Summons)).resolves.toBeTruthy();
  expect((await api.getSingleMeeting(id)).refsummons).toBeNull();
});

test('removing non-existant document', async () => {
  await api.createMeeting(MeetingType.Extra, 1, 2021);
  const { id } = (await api.getAllMeetings())[0];
  await expect(api.removeFileFromMeeting(id, MeetingDocumentType.Protocol)).resolves.toBeTruthy();
});

test('removing file from non-existant meeting', async () => {
  // Vilket ID som helst fungerar, databasen ska vara tom just nu
  await expect(
    api.removeFileFromMeeting('420', MeetingDocumentType.LateDocuments),
  ).rejects.toThrowError(ServerError);
});
