import { MEETING_TABLE } from '../../src/api/constants';
import knex from '../../src/api/knex';
import { MeetingAPI } from '../../src/api/meeting.api';
import { BadRequestError, NotFoundError, ServerError } from '../../src/errors/RequestErrors';
import { MeetingType } from '../../src/graphql.generated';
import { DatabaseMeeting } from '../../src/models/db/meeting';

const api = new MeetingAPI();

beforeEach(async () => {
  // Delete all rows
  await knex<DatabaseMeeting>(MEETING_TABLE).delete().where('id', '!=', 'null');
});

// Vi sparar databasen före och lägger tillbaka den efter
let dbBefore: DatabaseMeeting[];
beforeAll(async () => {
  dbBefore = await knex<DatabaseMeeting>(MEETING_TABLE).select('*');
});

afterAll(async () => {
  await knex<DatabaseMeeting>(MEETING_TABLE).delete().where('id', '!=', 'null');
  await knex<DatabaseMeeting>(MEETING_TABLE).insert(dbBefore);
});

test('creating valid VTM/HTM/VM specifying year but not number', async () => {
  const success = await api.createMeeting(MeetingType.Vtm, null, 2008);
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
  const success = await api.createMeeting(MeetingType.Htm, 3, null);
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

test('creating two concurrent board meetings', async () => {
  await api.createMeeting(MeetingType.Sm, 1, 2021);
  await api.createMeeting(MeetingType.Sm, 4, 2021);
  await api.createMeeting(MeetingType.Sm, null, 2021);
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
  await api.createMeeting(MeetingType.Sm, null, 2021);
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
  expect(
    (await api.getMultipleMeetings({ type: MeetingType.Sm, number: 5000, year: 0 })).length
  ).toBe(0);
});
