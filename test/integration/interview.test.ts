import prisma from '@/api/prisma';
import tokenProvider from '@/auth';
import { ElectionAPI } from '@api/election';
import { InterviewAPI } from '@api/interview';
import { Feature } from '@generated/graphql';
import { PrismaNominationAnswer, PrismaPost, PrismaUser } from '@prisma/client';
import { EmailAttachment, sendEmail } from '@service/email';
import requestWithAuth from '@test/utils/requestWithAuth';
import { genRandomUser } from '@test/utils/utils';

jest.mock('@service/email', () => ({ sendEmail: jest.fn() }));

const mockedSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
const electionApi = new ElectionAPI();
const interviewApi = new InterviewAPI();

const at = (hm: string) => new Date(`2030-01-10T${hm}:00.000Z`);

let admin: PrismaUser;
let nominee: PrismaUser;
let other: PrismaUser;
let posts: PrismaPost[];
let plainPost: PrismaPost;
let electionId: number;
const cleanup: (() => Promise<void>)[] = [];

const token = (u: PrismaUser) => tokenProvider.issueToken(u.username, 'access_token');
const gql = (query: string, variables: Record<string, unknown>, as: PrismaUser) =>
  requestWithAuth(query, variables, token(as));

type Mail = {
  to: string[];
  subject: string;
  template: string;
  overrides: Record<string, string | string[]>;
  attachments: EmailAttachment[];
};

const mails = (): Mail[] =>
  mockedSendEmail.mock.calls.map(([to, subject, template, overrides, , attachments]) => ({
    to: Array.isArray(to) ? to : [to],
    subject,
    template,
    overrides,
    attachments: attachments ?? [],
  }));

const icsOf = (mail: Mail) => {
  expect(mail.attachments).toHaveLength(1);
  return Buffer.from(mail.attachments[0].content, 'base64').toString('utf8').replace(/\r\n /g, '');
};

const icsField = (ics: string, name: string) =>
  ics
    .split('\r\n')
    .find((l) => l.startsWith(`${name}:`))
    ?.slice(name.length + 1);

beforeAll(async () => {
  const suffix = Date.now().toString(36);
  const mk = (i: number, interviewRequired: boolean) =>
    prisma.prismaPost.create({
      data: {
        postname: `IntegrationPost ${i} ${suffix}`,
        utskott: 'STYRELSEN',
        postType: 'U',
        spots: 1,
        description: 'test',
        interviewRequired,
      },
    });
  posts = await Promise.all([0, 1, 2, 3, 4].map((i) => mk(i, true)));
  plainPost = await mk(9, false);

  const create = async (access: Feature[] = []) => {
    const [c, r] = genRandomUser(access);
    cleanup.push(r);
    return c();
  };
  admin = await create([Feature.ElectionAdmin]);
  nominee = await create();
  other = await create();
});

beforeEach(async () => {
  mockedSendEmail.mockReset();
  await electionApi.clear();
  const e = await electionApi.createElection(
    admin.username,
    [...posts.map((p) => p.id), plainPost.id],
    false,
  );
  electionId = e.id;
  await electionApi.openElection(electionId);
  const id = e.id;
  await prisma.prismaNomination.createMany({
    data: [nominee, other].flatMap((u) =>
      [...posts, plainPost].map((p) => ({
        refElection: id,
        refUser: u.username,
        refPost: p.id,
        answer: PrismaNominationAnswer.NOT_ANSWERED,
      })),
    ),
  });
});

afterAll(async () => {
  await electionApi.clear();
  await prisma.prismaPost.deleteMany({
    where: { id: { in: [...posts, plainPost].map((p) => p.id) } },
  });
  await Promise.all(cleanup.map((c) => c()));
});

const RESPOND = `
  mutation ($postId: Int!, $accepts: NominationAnswer!, $expectedEffect: InterviewBookingEffect, $rebook: InterviewSlotInput) {
    respondToNomination(postId: $postId, accepts: $accepts, expectedEffect: $expectedEffect, rebook: $rebook)
  }`;
const PREVIEW = `
  query ($postId: Int!, $accepts: NominationAnswer!) {
    nominationResponsePreview(postId: $postId, accepts: $accepts) {
      effect requiredMinutesBefore requiredMinutesAfter requestWithdrawn
      availability { window { id } starts }
    }
  }`;
const MY = `
  query ($electionId: Int!) {
    myInterview(electionId: $electionId) {
      enabled requiredMinutes frozen
      booking { id startsAt endsAt location posts { id } }
      pendingRequest { id startsAt }
      availability { window { id location effectiveStepMinutes } starts }
    }
  }`;
const BOOK = `
  mutation ($electionId: Int!, $windowId: Int!, $startsAt: DateTime!) {
    bookInterview(electionId: $electionId, windowId: $windowId, startsAt: $startsAt) { id startsAt endsAt }
  }`;
const CREATE_WINDOW = `
  mutation ($electionId: Int!, $input: InterviewWindowInput!) {
    createInterviewWindow(electionId: $electionId, input: $input) { id }
  }`;

const respond = (postIndex: number, accepts: string, extra: Record<string, unknown> = {}) =>
  gql(RESPOND, { postId: posts[postIndex].id, accepts, ...extra }, nominee);

const createWindow = async (input: Record<string, unknown> = {}) => {
  const res = await gql(
    CREATE_WINDOW,
    {
      electionId,
      input: { startsAt: at('17:00'), endsAt: at('19:00'), location: 'E:1123', ...input },
    },
    admin,
  );
  expect(res.errors).toBeUndefined();
  return (res.data.createInterviewWindow as { id: number }).id;
};

const book = async (windowId: number, hm: string, as = nominee) => {
  const res = await gql(BOOK, { electionId, windowId, startsAt: at(hm) }, as);
  expect(res.errors).toBeUndefined();
  return res.data.bookInterview as { id: string };
};

describe('access', () => {
  it('keeps admin operations from plain members', async () => {
    const res = await gql(
      CREATE_WINDOW,
      {
        electionId,
        input: { startsAt: at('17:00'), endsAt: at('18:00'), location: 'x' },
      },
      nominee,
    );
    expect(res.errors?.[0]).toMatchObject({ errorType: 'ForbiddenError' });

    for (const q of [
      'query ($e: Int!) { interviewBookings(electionId: $e) { id } }',
      'query ($e: Int!) { interviewMissing(electionId: $e) { minutesNeeded } }',
      'query ($e: Int!) { interviewSettings(electionId: $e) { frozen } }',
    ]) {
      const r = await gql(q, { e: electionId }, nominee);
      expect(r.errors?.[0]).toMatchObject({ errorType: 'ForbiddenError' });
    }
  });

  it('only shows a nominee their own booking and requests', async () => {
    const w = await createWindow({ capacity: 2 });
    await respond(0, 'YES');
    await gql(RESPOND, { postId: posts[0].id, accepts: 'YES' }, other);
    await book(w, '17:00', other);

    const mine = await gql(MY, { electionId }, nominee);
    expect(mine.data.myInterview).toMatchObject({ booking: null });

    const req = await gql(
      `mutation ($e: Int!, $u: String!, $w: Int!, $s: DateTime!) {
        requestInterview(electionId: $e, username: $u, windowId: $w, startsAt: $s) { id }
      }`,
      { e: electionId, u: other.username, w, s: at('18:00') },
      admin,
    );
    const requestId = (req.data.requestInterview as { id: string }).id;
    const hijack = await gql(
      'mutation ($id: String!) { respondToInterviewRequest(requestId: $id, accept: true) }',
      { id: requestId },
      nominee,
    );
    expect(hijack.errors?.[0]).toMatchObject({ errorType: 'NotFoundError' });
  });
});

describe('nominee flow', () => {
  it('is disabled until the election has windows', async () => {
    await respond(0, 'YES');
    const res = await gql(MY, { electionId }, nominee);
    expect(res.data.myInterview).toMatchObject({ enabled: false, requiredMinutes: 15 });
  });

  it('accepting without a booking needs no confirmation and sends no mail', async () => {
    await createWindow();
    const res = await respond(0, 'YES');
    expect(res.errors).toBeUndefined();
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it('booking sends one confirmation with a calendar invite', async () => {
    const w = await createWindow();
    await respond(0, 'YES');
    await respond(1, 'YES');

    const my = await gql(MY, { electionId }, nominee);
    expect(my.data.myInterview).toMatchObject({
      enabled: true,
      requiredMinutes: 30,
      availability: [{ window: { id: w, location: 'E:1123', effectiveStepMinutes: 15 } }],
    });

    const booking = await book(w, '17:30');
    expect(mails()).toHaveLength(1);
    const [mail] = mails();
    expect(mail).toMatchObject({
      to: [nominee.email],
      subject: 'Din intervju är bokad',
      template: 'interview',
    });
    expect(mail.overrides.time).toBe('torsdag 10 januari 2030 kl. 18:30–19:00');
    expect(mail.overrides.posts).toHaveLength(2);

    const ics = icsOf(mail);
    expect(icsField(ics, 'METHOD')).toBe('REQUEST');
    expect(icsField(ics, 'UID')).toBe(`interview-${booking.id}@esek.se`);
    expect(icsField(ics, 'SEQUENCE')).toBe('0');
    expect(icsField(ics, 'DTSTART')).toBe('20300110T173000Z');
    expect(icsField(ics, 'DTEND')).toBe('20300110T180000Z');
  });

  it('rescheduling keeps the calendar event and bumps its sequence', async () => {
    const w = await createWindow();
    await respond(0, 'YES');
    const first = await book(w, '17:00');
    const second = await book(w, '18:00');
    expect(second.id).toBe(first.id);

    const last = mails()[1];
    expect(last.subject).toBe('Din intervju är ombokad');
    expect(icsField(icsOf(last), 'UID')).toBe(`interview-${first.id}@esek.se`);
    expect(icsField(icsOf(last), 'SEQUENCE')).toBe('1');
  });

  it('cancelling sends a calendar cancellation for the same event', async () => {
    const w = await createWindow();
    await respond(0, 'YES');
    const booking = await book(w, '17:00');
    const res = await gql(
      'mutation ($e: Int!) { cancelMyInterview(electionId: $e) }',
      { e: electionId },
      nominee,
    );
    expect(res.errors).toBeUndefined();

    const ics = icsOf(mails()[1]);
    expect(icsField(ics, 'METHOD')).toBe('CANCEL');
    expect(icsField(ics, 'STATUS')).toBe('CANCELLED');
    expect(icsField(ics, 'UID')).toBe(`interview-${booking.id}@esek.se`);
    expect(icsField(ics, 'SEQUENCE')).toBe('1');
  });
});

describe('nomination changes while booked', () => {
  it('refuse to change anything without the confirmed effect', async () => {
    const w = await createWindow();
    await respond(0, 'YES');
    await book(w, '17:00');
    mockedSendEmail.mockReset();

    const unconfirmed = await respond(1, 'YES');
    expect(unconfirmed.errors?.[0]).toMatchObject({ errorType: 'ConflictError' });

    const wrong = await respond(1, 'YES', { expectedEffect: 'KEPT_POST_ADDED' });
    expect(wrong.errors?.[0]).toMatchObject({ errorType: 'ConflictError' });

    // Nothing changed: still booked, still one accepted post, no mail
    const my = await gql(MY, { electionId }, nominee);
    expect(my.data.myInterview).toMatchObject({ requiredMinutes: 15 });
    expect((my.data.myInterview as { booking: unknown }).booking).not.toBeNull();
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it('preview and confirmed change agree, and the removal is mailed', async () => {
    const w = await createWindow();
    await respond(0, 'YES');
    const booking = await book(w, '17:00');
    mockedSendEmail.mockReset();

    const preview = await gql(PREVIEW, { postId: posts[1].id, accepts: 'YES' }, nominee);
    expect(preview.data.nominationResponsePreview).toMatchObject({
      effect: 'UNBOOKED',
      requiredMinutesAfter: 30,
    });

    const res = await respond(1, 'YES', { expectedEffect: 'UNBOOKED' });
    expect(res.errors).toBeUndefined();
    expect((await gql(MY, { electionId }, nominee)).data.myInterview).toMatchObject({
      booking: null,
      requiredMinutes: 30,
    });

    expect(mails()).toHaveLength(1);
    expect(mails()[0].subject).toBe('Din intervju är avbokad – boka en ny tid');
    const ics = icsOf(mails()[0]);
    expect(icsField(ics, 'METHOD')).toBe('CANCEL');
    expect(icsField(ics, 'UID')).toBe(`interview-${booking.id}@esek.se`);
  });

  it('rebooking in the same step sends one mail that moves the calendar event', async () => {
    const w = await createWindow();
    await respond(0, 'YES');
    const booking = await book(w, '17:00');
    mockedSendEmail.mockReset();

    const preview = await gql(PREVIEW, { postId: posts[1].id, accepts: 'YES' }, nominee);
    const starts = (
      preview.data.nominationResponsePreview as { availability: { starts: string[] }[] }
    ).availability[0].starts;
    // The nominee's own 17:00 booking is going away, so 17:00 is offered again
    expect(starts[0]).toBe(at('17:00').toISOString());

    const res = await respond(1, 'YES', {
      expectedEffect: 'UNBOOKED',
      rebook: { windowId: w, startsAt: at('18:00') },
    });
    expect(res.errors).toBeUndefined();

    const my = await gql(MY, { electionId }, nominee);
    expect(my.data.myInterview).toMatchObject({
      booking: {
        id: booking.id,
        startsAt: at('18:00').toISOString(),
        endsAt: at('18:30').toISOString(),
      },
    });
    expect(mails()).toHaveLength(1);
    const ics = icsOf(mails()[0]);
    expect(mails()[0].subject).toBe('Din intervju är ombokad');
    expect(icsField(ics, 'UID')).toBe(`interview-${booking.id}@esek.se`);
    expect(icsField(ics, 'SEQUENCE')).toBe('1');
  });

  it('a failed rebook leaves everything as it was', async () => {
    const w = await createWindow();
    await respond(0, 'YES');
    await book(w, '17:00');
    mockedSendEmail.mockReset();

    const res = await respond(1, 'YES', {
      expectedEffect: 'UNBOOKED',
      rebook: { windowId: w, startsAt: at('18:45') }, // 30 min would run past 19:00
    });
    expect(res.errors).toBeDefined();

    const my = await gql(MY, { electionId }, nominee);
    expect(my.data.myInterview).toMatchObject({
      requiredMinutes: 15,
      booking: { startsAt: at('17:00').toISOString() },
    });
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it('keeping the booking at the maximum is mailed with the new post list', async () => {
    const w = await createWindow();
    for (const i of [0, 1, 2, 3]) await respond(i, 'YES');
    await book(w, '17:00');
    mockedSendEmail.mockReset();

    const res = await respond(4, 'YES', { expectedEffect: 'KEPT_POST_ADDED' });
    expect(res.errors).toBeUndefined();
    expect(mails()).toHaveLength(1);
    expect(mails()[0].subject).toBe('Din intervju gäller nu fler poster');
    expect(mails()[0].overrides.posts).toHaveLength(5);
    expect(icsField(icsOf(mails()[0]), 'SEQUENCE')).toBe('1');
  });

  it("declining a post shortens the booking and moves the calendar event's end", async () => {
    const w = await createWindow();
    await respond(0, 'YES');
    await respond(1, 'YES');
    const booking = await book(w, '17:00');
    mockedSendEmail.mockReset();

    const preview = await gql(PREVIEW, { postId: posts[1].id, accepts: 'NO' }, nominee);
    expect(preview.data.nominationResponsePreview).toMatchObject({
      effect: 'SHORTENED',
      requiredMinutesBefore: 30,
      requiredMinutesAfter: 15,
    });

    const unconfirmed = await respond(1, 'NO');
    expect(unconfirmed.errors?.[0]).toMatchObject({ errorType: 'ConflictError' });

    const res = await respond(1, 'NO', { expectedEffect: 'SHORTENED' });
    expect(res.errors).toBeUndefined();
    expect((await gql(MY, { electionId }, nominee)).data.myInterview).toMatchObject({
      booking: {
        id: booking.id,
        startsAt: at('17:00').toISOString(),
        endsAt: at('17:15').toISOString(),
      },
    });

    expect(mails()).toHaveLength(1);
    expect(mails()[0].subject).toBe('Din intervju är kortare');
    const ics = icsOf(mails()[0]);
    expect(icsField(ics, 'UID')).toBe(`interview-${booking.id}@esek.se`);
    expect(icsField(ics, 'SEQUENCE')).toBe('1');
    expect(icsField(ics, 'DTSTART')).toBe('20300110T170000Z');
    expect(icsField(ics, 'DTEND')).toBe('20300110T171500Z');
  });

  it('answering a post without interview never needs confirmation', async () => {
    const w = await createWindow();
    await respond(0, 'YES');
    await book(w, '17:00');
    mockedSendEmail.mockReset();

    const res = await gql(RESPOND, { postId: plainPost.id, accepts: 'YES' }, nominee);
    expect(res.errors).toBeUndefined();
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it('after the freeze the committee is told and the booking stays', async () => {
    const w = await createWindow();
    await respond(0, 'YES');
    await book(w, '17:00');
    await interviewApi.updateSettings(electionId, { frozen: true });
    mockedSendEmail.mockReset();

    const res = await respond(1, 'YES', { expectedEffect: 'FLAGGED' });
    expect(res.errors).toBeUndefined();
    expect(mails()).toHaveLength(1);
    expect(mails()[0]).toMatchObject({
      to: ['vbordforande@esek.se', 'vbsekreterare@esek.se'],
      template: 'interview-committee',
    });
  });
});

describe('no slot available', () => {
  it('is only recorded when nothing fits', async () => {
    await createWindow({ endsAt: at('17:30') });
    await respond(0, 'YES');
    const REPORT = 'mutation ($e: Int!) { reportNoInterviewSlot(electionId: $e) }';

    expect((await gql(REPORT, { e: electionId }, nominee)).data.reportNoInterviewSlot).toBe(false);

    await respond(1, 'YES');
    await respond(2, 'YES');
    expect((await gql(REPORT, { e: electionId }, nominee)).data.reportNoInterviewSlot).toBe(true);
    expect(
      await prisma.prismaInterviewNoSlotEvent.count({ where: { refElection: electionId } }),
    ).toBe(1);
  });
});

describe('admin', () => {
  it('requests carry no calendar invite, and accepting books', async () => {
    const w = await createWindow();
    await respond(0, 'YES');
    const req = await gql(
      `mutation ($e: Int!, $u: String!, $w: Int!, $s: DateTime!) {
        requestInterview(electionId: $e, username: $u, windowId: $w, startsAt: $s) { id status }
      }`,
      { e: electionId, u: nominee.username, w, s: at('17:10') },
      admin,
    );
    expect(req.errors).toBeUndefined();
    expect(mails()[0]).toMatchObject({ subject: 'Valberedningen föreslår en intervjutid' });
    expect(mails()[0].attachments).toHaveLength(0);

    const requestId = (req.data.requestInterview as { id: string }).id;
    await gql(
      'mutation ($id: String!) { respondToInterviewRequest(requestId: $id, accept: true) }',
      { id: requestId },
      nominee,
    );
    expect(mails()[1].subject).toBe('Din intervju är bokad');
    expect(icsField(icsOf(mails()[1]), 'DTSTART')).toBe('20300110T171000Z');
  });

  it('cancelling a booking tells the nominee and cancels the calendar event', async () => {
    const w = await createWindow();
    await respond(0, 'YES');
    const booking = await book(w, '17:00');
    const res = await gql(
      'mutation ($id: String!) { cancelInterviewBooking(bookingId: $id) }',
      { id: booking.id },
      admin,
    );
    expect(res.errors).toBeUndefined();
    expect(mails()[1].overrides.intro).toBe('Valberedningen har avbokat din intervju.');
    expect(icsField(icsOf(mails()[1]), 'METHOD')).toBe('CANCEL');
  });

  it('moving a window sends booked nominees the new place', async () => {
    const w = await createWindow();
    await respond(0, 'YES');
    await book(w, '17:00');
    const res = await gql(
      'mutation ($w: Int!) { updateInterviewWindow(windowId: $w, input: { location: "E:B" }) { location } }',
      { w },
      admin,
    );
    expect(res.errors).toBeUndefined();
    expect(mails()[1]).toMatchObject({ subject: 'Ny plats för din intervju' });
    expect(icsField(icsOf(mails()[1]), 'LOCATION')).toBe('E:B');
  });

  it('notifies only nominees who need an interview and have none', async () => {
    const w = await createWindow({ capacity: 2 });
    await respond(0, 'YES');
    await gql(RESPOND, { postId: posts[0].id, accepts: 'YES' }, other);
    await book(w, '17:00', other);
    mockedSendEmail.mockReset();

    const res = await gql(
      'mutation ($e: Int!) { notifyUnbookedNominees(electionId: $e) }',
      { e: electionId },
      admin,
    );
    expect(res.data.notifyUnbookedNominees).toBe(1);
    expect(mails().map((m) => m.to)).toEqual([[nominee.email]]);
  });

  it('rejects video links that are not web links', async () => {
    const res = await gql(
      CREATE_WINDOW,
      {
        electionId,
        input: {
          startsAt: at('17:00'),
          endsAt: at('18:00'),
          videoLink: 'javascript:alert(1)',
        },
      },
      admin,
    );
    expect(res.errors?.[0]).toMatchObject({ errorType: 'BadRequestError' });
  });
});
