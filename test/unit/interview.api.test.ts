import prisma from '@/api/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/errors/request.errors';
import { ElectionAPI } from '@api/election';
import { InterviewAPI } from '@api/interview';
import { PrismaNominationAnswer, PrismaPost } from '@prisma/client';
import { genRandomUser } from '@test/utils/utils';

const api = new InterviewAPI();
const electionApi = new ElectionAPI();

const NOW = new Date('2030-01-01T08:00:00Z');
const at = (hm: string, day = '10') => new Date(`2030-01-${day}T${hm}:00Z`);

let posts: PrismaPost[] = [];
let plainPost: PrismaPost;
let users: string[] = [];
const removeUsers: (() => Promise<void>)[] = [];
let electionId: number;

const YES = PrismaNominationAnswer.YES;
const NO = PrismaNominationAnswer.NO;

beforeAll(async () => {
  const suffix = Date.now().toString(36);
  // Five interview posts so the 60 minute cap can be reached, plus one without interview
  posts = await Promise.all(
    [0, 1, 2, 3, 4].map((i) =>
      prisma.prismaPost.create({
        data: {
          postname: `Intervjupost ${i} ${suffix}`,
          utskott: 'STYRELSEN',
          postType: 'U',
          spots: 1,
          description: 'test',
          interviewRequired: true,
        },
      }),
    ),
  );
  plainPost = await prisma.prismaPost.create({
    data: {
      postname: `Utan intervju ${suffix}`,
      utskott: 'STYRELSEN',
      postType: 'U',
      spots: 1,
      description: 'test',
      interviewRequired: false,
    },
  });

  for (let i = 0; i < 6; i += 1) {
    const [create, remove] = genRandomUser();
    users.push((await create()).username);
    removeUsers.push(remove);
  }
});

beforeEach(async () => {
  await electionApi.clear();
  const election = await electionApi.createElection(
    'aa0000bb-s',
    [...posts.map((p) => p.id), plainPost.id],
    false,
  );
  electionId = election.id;
  await electionApi.openElection(electionId);
});

afterAll(async () => {
  await electionApi.clear();
  await prisma.prismaPost.deleteMany({
    where: { id: { in: [...posts, plainPost].map((p) => p.id) } },
  });
  await Promise.all(removeUsers.map((r) => r()));
  users = [];
});

/** Sets a nominee's answers directly, bypassing respondToNomination */
const accept = async (
  username: string,
  postIndexes: number[],
  answer: PrismaNominationAnswer = YES,
) => {
  await prisma.prismaNomination.createMany({
    data: postIndexes.map((i) => ({
      refElection: electionId,
      refUser: username,
      refPost: posts[i].id,
      answer,
    })),
    skipDuplicates: true,
  });
  await prisma.prismaNomination.updateMany({
    where: {
      refElection: electionId,
      refUser: username,
      refPost: { in: postIndexes.map((i) => posts[i].id) },
    },
    data: { answer },
  });
};

const window = (start = '17:00', end = '19:00', extra = {}) =>
  api.createWindow(electionId, {
    startsAt: at(start),
    endsAt: at(end),
    location: 'E:1123',
    ...extra,
  });

describe('settings', () => {
  it('uses defaults until changed', async () => {
    const s = await api.getSettings(electionId);
    expect(s).toMatchObject({
      defaultDurationMinutes: 15,
      maxDurationMinutes: 60,
      minNoticeMinutes: 1440,
      frozen: false,
      notifyEmails: ['vbordforande@esek.se', 'vbsekreterare@esek.se'],
    });
  });

  it('stores changes and rejects invalid values', async () => {
    await api.updateSettings(electionId, { defaultDurationMinutes: 20 });
    expect((await api.getSettings(electionId)).defaultDurationMinutes).toBe(20);
    await expect(api.updateSettings(electionId, { maxDurationMinutes: 0 })).rejects.toThrow(
      BadRequestError,
    );
    await expect(api.updateSettings(electionId, { notifyEmails: [] })).rejects.toThrow(
      BadRequestError,
    );
    await expect(api.updateSettings(999999, { frozen: true })).rejects.toThrow(NotFoundError);
  });

  it('overrides a post duration only for electable posts', async () => {
    await api.setPostDuration(electionId, posts[0].id, 30);
    await accept(users[0], [0, 1]);
    expect(await api.getRequiredMinutes(electionId, users[0])).toBe(45);

    await api.setPostDuration(electionId, posts[0].id, null);
    expect(await api.getRequiredMinutes(electionId, users[0])).toBe(30);

    const other = await electionApi.createElection('aa0000bb-s', [], false);
    await expect(api.setPostDuration(other.id, posts[0].id, 30)).rejects.toThrow(NotFoundError);
  });
});

describe('required minutes', () => {
  it('counts only accepted interview posts and caps at the maximum', async () => {
    await accept(users[0], [0, 1, 2, 3, 4]);
    expect(await api.getRequiredMinutes(electionId, users[0])).toBe(60);

    await accept(users[1], [0], NO);
    await prisma.prismaNomination.create({
      data: { refElection: electionId, refUser: users[1], refPost: plainPost.id, answer: YES },
    });
    expect(await api.getRequiredMinutes(electionId, users[1])).toBe(0);
  });

  it('ignores posts no longer electable', async () => {
    await accept(users[0], [0, 1]);
    await electionApi.removeElectables(electionId, [posts[1].id]);
    expect(await api.getRequiredMinutes(electionId, users[0])).toBe(15);
  });
});

describe('windows', () => {
  it('require a location or link, a positive length and capacity', async () => {
    await expect(
      api.createWindow(electionId, { startsAt: at('17:00'), endsAt: at('18:00') }),
    ).rejects.toThrow(BadRequestError);
    await expect(
      api.createWindow(electionId, {
        startsAt: at('18:00'),
        endsAt: at('17:00'),
        location: 'E:1123',
      }),
    ).rejects.toThrow(BadRequestError);
    await expect(window('17:00', '18:00', { capacity: 0 })).rejects.toThrow(BadRequestError);
    await expect(
      window('17:00', '18:00', { location: null, videoLink: 'https://meet.example/x' }),
    ).resolves.toBeTruthy();
  });
});

describe('booking', () => {
  it('books a fitting time and copies the location', async () => {
    const w = await window();
    await accept(users[0], [0, 1]);

    const { booking, previous } = await api.book(electionId, users[0], w.id, at('17:30'), NOW);
    expect(previous).toBeNull();
    expect(booking).toMatchObject({
      refWindow: w.id,
      startsAt: at('17:30'),
      endsAt: at('18:00'),
      location: 'E:1123',
      sequence: 0,
    });
  });

  it('rejects times off the grid, too soon, outside the window or taken', async () => {
    const w = await window();
    await accept(users[0], [0]);
    await accept(users[1], [0]);

    await expect(api.book(electionId, users[0], w.id, at('17:05'), NOW)).rejects.toThrow(
      'inte en av de tillgängliga starttiderna',
    );
    await expect(
      api.book(electionId, users[0], w.id, at('17:00'), new Date('2030-01-09T18:00:00Z')),
    ).rejects.toThrow('för nära');
    await expect(api.book(electionId, users[0], w.id, at('18:50'), NOW)).rejects.toThrow('utanför');

    await api.book(electionId, users[0], w.id, at('17:00'), NOW);
    await expect(api.book(electionId, users[1], w.id, at('17:00'), NOW)).rejects.toThrow(
      'redan bokad',
    );
  });

  it('refuses nominees without accepted interview posts', async () => {
    const w = await window();
    await accept(users[0], [0], NO);
    await expect(api.book(electionId, users[0], w.id, at('17:00'), NOW)).rejects.toThrow(
      BadRequestError,
    );
  });

  it('refuses a window from another election', async () => {
    const w = await window();
    const other = await electionApi.createElection('aa0000bb-s', [], false);
    await expect(api.book(other.id, users[0], w.id, at('17:00'), NOW)).rejects.toThrow(
      BadRequestError,
    );
  });

  it('reschedules in place, even onto time overlapping the current booking', async () => {
    const w = await window();
    await accept(users[0], [0, 1]);
    const first = await api.book(electionId, users[0], w.id, at('17:00'), NOW);
    const second = await api.book(electionId, users[0], w.id, at('17:15'), NOW);

    expect(second.previous?.id).toBe(first.booking.id);
    expect(second.booking).toMatchObject({
      id: first.booking.id,
      startsAt: at('17:15'),
      sequence: 1,
    });
    expect(await api.getBookings(electionId)).toHaveLength(1);
  });

  it('never gives the last spot to more than one nominee', async () => {
    const w = await window('17:00', '17:15');
    await Promise.all(users.map((u) => accept(u, [0])));

    const results = await Promise.allSettled(
      users.map((u) => api.book(electionId, u, w.id, at('17:00'), NOW)),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await api.getBookings(electionId)).toHaveLength(1);
  });

  it('fills parallel capacity exactly', async () => {
    const w = await window('17:00', '17:15', { capacity: 2 });
    await Promise.all(users.map((u) => accept(u, [0])));

    const results = await Promise.allSettled(
      users.map((u) => api.book(electionId, u, w.id, at('17:00'), NOW)),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(2);
  });

  it('allows cancelling until the freeze', async () => {
    const w = await window();
    await accept(users[0], [0]);
    await api.book(electionId, users[0], w.id, at('17:00'), NOW);

    await api.updateSettings(electionId, { freezeAt: new Date('2030-01-05T00:00:00Z') });
    await expect(
      api.cancelOwnBooking(electionId, users[0], new Date('2030-01-05T00:00:00Z')),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      api.book(electionId, users[0], w.id, at('17:15'), new Date('2030-01-05T00:00:00Z')),
    ).rejects.toThrow(ForbiddenError);

    await api.cancelOwnBooking(electionId, users[0], NOW);
    expect(await api.getBooking(electionId, users[0])).toBeNull();
  });

  it('offers only times that fit the nominee', async () => {
    const w = await window('17:00', '18:00');
    await accept(users[0], [0]);
    await accept(users[1], [0, 1, 2, 3]);
    await api.book(electionId, users[0], w.id, at('17:15'), NOW);

    const short = await api.getAvailability(electionId, users[0], NOW);
    // Own booking does not block, so all four quarter hours are offered
    expect(short[0].starts).toEqual([at('17:00'), at('17:15'), at('17:30'), at('17:45')]);

    expect(await api.getAvailability(electionId, users[1], NOW)).toEqual([]);

    await api.updateSettings(electionId, { frozen: true });
    expect(await api.getAvailability(electionId, users[0], NOW)).toEqual([]);
  });
});

describe('changing windows never removes bookings', () => {
  it('keeps bookings when a window shrinks, and flags them', async () => {
    const w = await window('17:00', '19:00');
    await accept(users[0], [0]);
    await api.book(electionId, users[0], w.id, at('18:30'), NOW);

    await api.updateWindow(w.id, { endsAt: at('18:00') });
    expect(await api.getBooking(electionId, users[0])).not.toBeNull();
    const view = await api.getMissingView(electionId, NOW);
    expect(view.outsideWindow.map((b) => b.refUser)).toEqual([users[0]]);
  });

  it('keeps bookings when capacity drops, and flags them', async () => {
    const w = await window('17:00', '18:00', { capacity: 2 });
    await accept(users[0], [0]);
    await accept(users[1], [0]);
    await api.book(electionId, users[0], w.id, at('17:00'), NOW);
    await api.book(electionId, users[1], w.id, at('17:00'), NOW);

    await api.updateWindow(w.id, { capacity: 1 });
    expect(await api.getBookings(electionId)).toHaveLength(2);
    expect((await api.getMissingView(electionId, NOW)).overCapacity).toHaveLength(2);
  });

  it('keeps bookings when a window is deleted', async () => {
    const w = await window();
    await accept(users[0], [0]);
    await api.book(electionId, users[0], w.id, at('17:00'), NOW);

    await api.deleteWindow(w.id);
    const booking = await api.getBooking(electionId, users[0]);
    expect(booking).toMatchObject({ refWindow: null, location: 'E:1123' });
    expect((await api.getMissingView(electionId, NOW)).outsideWindow).toHaveLength(1);
  });

  it('moves bookings to a new location and bumps their calendar sequence', async () => {
    const w = await window();
    await accept(users[0], [0]);
    await api.book(electionId, users[0], w.id, at('17:00'), NOW);

    const unchanged = await api.updateWindow(w.id, { capacity: 3 });
    expect(unchanged.relocated).toHaveLength(0);

    const { relocated } = await api.updateWindow(w.id, { location: 'E:1124' });
    expect(relocated).toMatchObject([{ location: 'E:1124', sequence: 1 }]);
  });

  it('rejects an update that leaves no location or link', async () => {
    const w = await window();
    await expect(api.updateWindow(w.id, { location: null })).rejects.toThrow(BadRequestError);
  });
});

describe('nomination changes', () => {
  const book = async (username: string, postIndexes: number[], start = '17:00') => {
    const w = await window('17:00', '19:00', { capacity: 5 });
    await accept(username, postIndexes);
    return api.book(electionId, username, w.id, at(start), NOW);
  };

  const change = (username: string, postIndex: number, answer: PrismaNominationAnswer) =>
    prisma.$transaction(async (tx) => {
      const outcome = await api.applyNominationChange(
        tx,
        electionId,
        username,
        posts[postIndex].id,
        answer,
        NOW,
      );
      await tx.prismaNomination.upsert({
        where: {
          refElection_refPost_refUser: {
            refElection: electionId,
            refPost: posts[postIndex].id,
            refUser: username,
          },
        },
        create: {
          refElection: electionId,
          refPost: posts[postIndex].id,
          refUser: username,
          answer,
        },
        update: { answer },
      });
      return outcome;
    });

  it('previews without changing anything', async () => {
    await book(users[0], [0]);
    const preview = await api.previewNominationChange(electionId, users[0], posts[1].id, YES, NOW);
    expect(preview).toMatchObject({
      effect: 'UNBOOKED',
      requiredMinutesBefore: 15,
      requiredMinutesAfter: 30,
    });
    expect(await api.getBooking(electionId, users[0])).not.toBeNull();
  });

  it('removes the booking when the interview gets longer', async () => {
    await book(users[0], [0]);
    expect((await change(users[0], 1, YES)).effect).toBe('UNBOOKED');
    expect(await api.getBooking(electionId, users[0])).toBeNull();
  });

  it('keeps the booking when accepting at the maximum length', async () => {
    const { booking } = await book(users[0], [0, 1, 2, 3]);
    const outcome = await change(users[0], 4, YES);
    expect(outcome.effect).toBe('KEPT_POST_ADDED');
    expect(outcome.booking).toMatchObject({ id: booking.id, sequence: 1 });
  });

  it('shortens the booking, keeping its start, when declining one post', async () => {
    const { booking } = await book(users[0], [0, 1]);
    const outcome = await change(users[0], 1, NO);
    expect(outcome.effect).toBe('SHORTENED');
    expect(await api.getBooking(electionId, users[0])).toMatchObject({
      id: booking.id,
      startsAt: booking.startsAt,
      endsAt: new Date(booking.startsAt.getTime() + 15 * 60000),
      sequence: 1,
    });
  });

  it('keeps the booking when declining still needs the maximum length', async () => {
    const { booking } = await book(users[0], [0, 1, 2, 3, 4]);
    const outcome = await change(users[0], 4, NO);
    expect(outcome.effect).toBe('KEPT_POST_REMOVED');
    expect(await api.getBooking(electionId, users[0])).toMatchObject({
      endsAt: booking.endsAt,
      sequence: 1,
    });
  });

  it('frees the shortened time for others', async () => {
    const w = await window('17:00', '17:30');
    await accept(users[0], [0, 1]);
    await accept(users[1], [0]);
    await api.book(electionId, users[0], w.id, at('17:00'), NOW);
    expect(await api.getAvailability(electionId, users[1], NOW)).toEqual([]);

    await change(users[0], 1, NO);
    const free = await api.getAvailability(electionId, users[1], NOW);
    expect(free[0].starts).toEqual([at('17:15')]);
  });

  it('frees the booking when the last interview post is declined', async () => {
    await book(users[0], [0]);
    expect((await change(users[0], 0, NO)).effect).toBe('FREED');
    expect(await api.getBooking(electionId, users[0])).toBeNull();
  });

  it('does nothing when the same answer is sent again', async () => {
    await book(users[0], [0]);
    expect((await change(users[0], 0, YES)).effect).toBe('NONE');
    expect(await api.getBooking(electionId, users[0])).toMatchObject({ sequence: 0 });
  });

  it('flags instead of unbooking after the freeze', async () => {
    await book(users[0], [0]);
    await api.updateSettings(electionId, { frozen: true });
    expect((await change(users[0], 1, YES)).effect).toBe('FLAGGED');
    expect(await api.getBooking(electionId, users[0])).toMatchObject({
      needsAdminAttention: true,
    });
    expect((await api.getMissingView(electionId, NOW)).needsAttention).toHaveLength(1);
  });

  it('withdraws a pending request whose length no longer fits', async () => {
    const w = await window('17:00', '19:00');
    await accept(users[0], [0]);
    await api.createRequest('aa0000bb-s', electionId, users[0], w.id, at('17:00'), NOW);

    const outcome = await change(users[0], 1, YES);
    expect(outcome.withdrawnRequest).not.toBeNull();
    expect(await api.getPendingRequest(electionId, users[0], NOW)).toBeNull();
  });
});

describe('admin requests', () => {
  it('reserve their time until answered', async () => {
    const w = await window('17:00', '17:15');
    await accept(users[0], [0]);
    await accept(users[1], [0]);
    await api.createRequest('aa0000bb-s', electionId, users[0], w.id, at('17:00'), NOW);

    await expect(api.book(electionId, users[1], w.id, at('17:00'), NOW)).rejects.toThrow(
      'redan bokad',
    );
    expect(await api.getAvailability(electionId, users[1], NOW)).toEqual([]);
  });

  it('expire at the minimum notice and can no longer be accepted', async () => {
    const w = await window('17:00', '17:15');
    await accept(users[0], [0]);
    const { request } = await api.createRequest(
      'aa0000bb-s',
      electionId,
      users[0],
      w.id,
      at('17:00'),
      NOW,
    );

    // Minimum notice is 24 h, so the request expires at 17:00 the day before
    const lastMoment = new Date('2030-01-09T17:00:00Z');
    const expired = new Date('2030-01-09T17:00:01Z');
    expect(await api.getPendingRequest(electionId, users[0], lastMoment)).not.toBeNull();
    expect(await api.getPendingRequest(electionId, users[0], expired)).toBeNull();
    expect(await api.getPendingRequests(electionId, expired)).toHaveLength(0);
    await expect(api.respondToRequest(users[0], request.id, true, expired)).rejects.toThrow(
      'gått ut',
    );
  });

  it('keep the old booking until accepted, then replace it', async () => {
    const w = await window('17:00', '19:00');
    await accept(users[0], [0]);
    const { booking } = await api.book(electionId, users[0], w.id, at('17:00'), NOW);
    const { request } = await api.createRequest(
      'aa0000bb-s',
      electionId,
      users[0],
      w.id,
      at('18:10'),
      NOW,
    );
    expect(await api.getBooking(electionId, users[0])).toMatchObject({ startsAt: at('17:00') });

    const res = await api.respondToRequest(users[0], request.id, true, NOW);
    expect(res.previous?.startsAt).toEqual(at('17:00'));
    expect(res.booking).toMatchObject({ id: booking.id, startsAt: at('18:10'), sequence: 1 });
    expect(res.request.status).toBe('ACCEPTED');
  });

  it('can be declined, leaving the booking alone', async () => {
    const w = await window('17:00', '19:00');
    await accept(users[0], [0]);
    await api.book(electionId, users[0], w.id, at('17:00'), NOW);
    const { request } = await api.createRequest(
      'aa0000bb-s',
      electionId,
      users[0],
      w.id,
      at('18:00'),
      NOW,
    );
    const res = await api.respondToRequest(users[0], request.id, false, NOW);
    expect(res.request.status).toBe('DECLINED');
    expect(await api.getBooking(electionId, users[0])).toMatchObject({ startsAt: at('17:00') });
  });

  it('are only answerable by their nominee', async () => {
    const w = await window();
    await accept(users[0], [0]);
    const { request } = await api.createRequest(
      'aa0000bb-s',
      electionId,
      users[0],
      w.id,
      at('17:00'),
      NOW,
    );
    await expect(api.respondToRequest(users[1], request.id, true, NOW)).rejects.toThrow(
      NotFoundError,
    );
  });

  it('replace an earlier pending request, and are withdrawn when the nominee books', async () => {
    const w = await window('17:00', '19:00');
    await accept(users[0], [0]);
    const first = await api.createRequest(
      'aa0000bb-s',
      electionId,
      users[0],
      w.id,
      at('17:00'),
      NOW,
    );
    const second = await api.createRequest(
      'aa0000bb-s',
      electionId,
      users[0],
      w.id,
      at('17:30'),
      NOW,
    );
    expect(second.replaced?.id).toBe(first.request.id);
    expect((await api.getRequest(first.request.id)).status).toBe('WITHDRAWN');

    await api.book(electionId, users[0], w.id, at('18:00'), NOW);
    expect((await api.getRequest(second.request.id)).status).toBe('WITHDRAWN');
  });

  it('can be made and accepted after the freeze', async () => {
    const w = await window();
    await accept(users[0], [0]);
    await api.updateSettings(electionId, { frozen: true });
    const { request } = await api.createRequest(
      'aa0000bb-s',
      electionId,
      users[0],
      w.id,
      at('17:07'),
      NOW,
    );
    const res = await api.respondToRequest(users[0], request.id, true, NOW);
    expect(res.booking?.startsAt).toEqual(at('17:07'));
  });
});

describe('admin overview', () => {
  it('reports unbooked nominees and the minutes needed and available', async () => {
    const w = await window('17:00', '18:00', { bufferMinutes: 5 });
    await accept(users[0], [0]);
    await accept(users[1], [0, 1]);
    await accept(users[2], [0, 1, 2, 3, 4]);
    await api.book(electionId, users[0], w.id, at('17:00'), NOW);

    const view = await api.getMissingView(electionId, NOW);
    expect(view.unbooked.map((u) => u.username).sort()).toEqual([users[1], users[2]].sort());
    expect(view.minutesNeeded).toBe(30 + 60);
    expect(view.minutesAvailable).toBe(60 - 15 - 5);
  });

  it('flags bookings shorter than the nominee now needs', async () => {
    const w = await window();
    await accept(users[0], [0]);
    await api.book(electionId, users[0], w.id, at('17:00'), NOW);
    await api.updateSettings(electionId, { defaultDurationMinutes: 20 });

    const view = await api.getMissingView(electionId, NOW);
    expect(view.tooShort).toMatchObject([{ requiredMinutes: 20 }]);
  });

  it('lets an admin cancel any booking, even after the freeze', async () => {
    const w = await window();
    await accept(users[0], [0]);
    const { booking } = await api.book(electionId, users[0], w.id, at('17:00'), NOW);
    await api.updateSettings(electionId, { frozen: true });
    await api.adminCancelBooking(booking.id);
    expect(await api.getBooking(electionId, users[0])).toBeNull();
  });
});

describe('daily summary', () => {
  it('hands out each event once and only to one caller', async () => {
    await api.recordNoSlot(electionId, users[0], 30);
    const summary = new Date(Date.now() + 60_000);

    const claims = await Promise.allSettled([
      api.claimDailySummary(electionId, summary),
      api.claimDailySummary(electionId, summary),
      api.claimDailySummary(electionId, summary),
    ]);
    const winners = claims.filter((c) => c.status === 'fulfilled' && c.value !== null);
    expect(winners).toHaveLength(1);

    expect(await api.claimDailySummary(electionId, summary)).toBeNull();

    // An event after the first summary belongs to the next one
    await prisma.prismaInterviewNoSlotEvent.create({
      data: {
        refElection: electionId,
        refUser: users[1],
        requiredMinutes: 15,
        createdAt: new Date(summary.getTime() + 1000),
      },
    });
    const next = await api.claimDailySummary(electionId, new Date(summary.getTime() + 86_400_000));
    expect(next?.events.map((e) => e.refUser)).toEqual([users[1]]);
  });
});
