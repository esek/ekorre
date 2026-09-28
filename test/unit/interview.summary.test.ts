import prisma from '@/api/prisma';
import { ElectionAPI } from '@api/election';
import { sendEmail } from '@service/email';
import { runDailySummaries } from '@service/interview-summary';
import { genRandomUser } from '@test/utils/utils';

jest.mock('@service/email', () => ({ sendEmail: jest.fn() }));

const mockedSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
const electionApi = new ElectionAPI();

let electionId: number;
let username: string;
let removeUser: () => Promise<void>;

const event = (createdAt: string, minutes = 30) =>
  prisma.prismaInterviewNoSlotEvent.create({
    data: {
      refElection: electionId,
      refUser: username,
      requiredMinutes: minutes,
      createdAt: new Date(createdAt),
    },
  });

beforeAll(async () => {
  const [create, remove] = genRandomUser();
  username = (await create()).username;
  removeUser = remove;
});

beforeEach(async () => {
  mockedSendEmail.mockReset();
  await electionApi.clear();
  electionId = (await electionApi.createElection('aa0000bb-s', [], false)).id;
});

afterAll(async () => {
  await electionApi.clear();
  await removeUser();
});

// 5 Oct 2026 is summer time: 17:15 in Stockholm is 15:15 UTC
test('sends one summary at 17:15 and never twice', async () => {
  await event('2026-10-05T10:00:00Z');

  expect(await runDailySummaries(new Date('2026-10-05T15:14:59Z'))).toBe(0);
  expect(await runDailySummaries(new Date('2026-10-05T15:15:00Z'))).toBe(1);
  expect(await runDailySummaries(new Date('2026-10-05T15:15:01Z'))).toBe(0);
  expect(await runDailySummaries(new Date('2026-10-05T22:00:00Z'))).toBe(0);

  expect(mockedSendEmail).toHaveBeenCalledTimes(1);
  const [to, subject, template, overrides] = mockedSendEmail.mock.calls[0];
  expect(to).toEqual(['vbordforande@esek.se', 'vbsekreterare@esek.se']);
  expect(subject).toBe('Nominerade saknar intervjutid');
  expect(template).toBe('interview-committee');
  expect((overrides.lines as string[]).join('\n')).toContain(`(${username}), 30 min`);
});

test('catches up after downtime without skipping or repeating', async () => {
  await event('2026-10-05T10:00:00Z');
  // Server was down at 17:15 and starts at 19:00
  expect(await runDailySummaries(new Date('2026-10-05T17:00:00Z'))).toBe(1);
  expect(await runDailySummaries(new Date('2026-10-05T17:00:05Z'))).toBe(0);
});

test('is quiet on days without events, and picks up later ones next day', async () => {
  await event('2026-10-05T10:00:00Z');
  await runDailySummaries(new Date('2026-10-05T15:20:00Z'));
  mockedSendEmail.mockReset();

  expect(await runDailySummaries(new Date('2026-10-06T15:20:00Z'))).toBe(0);

  // After 6 Oct's summary, so it belongs to 7 Oct's
  await event('2026-10-06T16:00:00Z', 45);
  expect(await runDailySummaries(new Date('2026-10-07T15:20:00Z'))).toBe(1);
  const lines = mockedSendEmail.mock.calls[0][3].lines as string[];
  expect(lines.join('\n')).toContain('45 min');
});

test('an event just after 17:15 waits for the next day', async () => {
  await event('2026-10-05T15:16:00Z');
  expect(await runDailySummaries(new Date('2026-10-05T15:20:00Z'))).toBe(0);
  expect(await runDailySummaries(new Date('2026-10-06T15:20:00Z'))).toBe(1);
});

test('uses winter time after daylight saving ends', async () => {
  // 26 Oct 2026 is winter time: 17:15 in Stockholm is 16:15 UTC
  await event('2026-10-26T10:00:00Z');
  expect(await runDailySummaries(new Date('2026-10-26T15:30:00Z'))).toBe(0);
  expect(await runDailySummaries(new Date('2026-10-26T16:15:00Z'))).toBe(1);
});

test('lists each nominee once with the longest length they needed', async () => {
  await event('2026-10-05T09:00:00Z', 15);
  await event('2026-10-05T10:00:00Z', 45);
  await runDailySummaries(new Date('2026-10-05T15:20:00Z'));
  const lines = mockedSendEmail.mock.calls[0][3].lines as string[];
  expect(lines.filter((l) => l.includes(username))).toEqual([expect.stringContaining('45 min')]);
});
