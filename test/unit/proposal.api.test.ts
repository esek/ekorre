import prisma from '@/api/prisma';
import { BadRequestError, NotFoundError } from '@/errors/request.errors';
import { ElectionAPI } from '@api/election';
import { ProposalAPI } from '@api/proposal';
import { PrismaNominationAnswer, PrismaPost, PrismaProposalStatus } from '@prisma/client';
import { genRandomUser } from '@test/utils/utils';

const api = new ProposalAPI();
const electionApi = new ElectionAPI();

const { DRAFT, PENDING, ACCEPTED, DECLINED, WITHDRAWN } = PrismaProposalStatus;
const { YES, NO, NOT_ANSWERED } = PrismaNominationAnswer;

let unique: PrismaPost; // U, 1 spot
let pair: PrismaPost; // EXACT_N, 2 spots
let many: PrismaPost; // EA, any number
let notElectable: PrismaPost;
let users: string[] = [];
const removeUsers: (() => Promise<void>)[] = [];

let electionId: number;
/** While the committee works: after closing, before the deadline */
let NOW: Date;
let DEADLINE: Date;
let AFTER: Date;

const HOUR = 60 * 60 * 1000;

const proposal = (username: string, postId: number) =>
  prisma.prismaProposal.findUnique({
    where: {
      refElection_refPost_refUser: { refElection: electionId, refPost: postId, refUser: username },
    },
  });

const counterAnswer = async (username: string, postId: number) =>
  (
    await prisma.prismaCounterCandidacy.findUnique({
      where: {
        refElection_refPost_refUser: {
          refElection: electionId,
          refPost: postId,
          refUser: username,
        },
      },
    })
  )?.answer;

const nominate = (username: string, postId: number, answer: PrismaNominationAnswer = YES) =>
  prisma.prismaNomination.create({
    data: { refElection: electionId, refUser: username, refPost: postId, answer },
  });

/** Closes the election and sets the deadline a day later */
const close = async () => {
  await electionApi.closeElection(electionId);
  const { closedAt } = await prisma.prismaElection.findUniqueOrThrow({ where: { id: electionId } });
  const closed = (closedAt as Date).getTime();
  NOW = new Date(closed + HOUR);
  DEADLINE = new Date(closed + 24 * HOUR);
  AFTER = new Date(DEADLINE.getTime() + 60 * 1000);
  await api.setDeadline(electionId, DEADLINE, NOW);
};

/** Proposes and sends in one go */
const proposeAndSend = async (postId: number, ...usernames: string[]) => {
  for (const u of usernames) {
    await api.propose(electionId, u, postId, NOW);
  }
  return api.sendProposals(electionId, postId, NOW);
};

beforeAll(async () => {
  const suffix = Date.now().toString(36);
  const mk = (name: string, postType: 'U' | 'EXACT_N' | 'EA', spots: number) =>
    prisma.prismaPost.create({
      data: {
        postname: `${name} ${suffix}`,
        utskott: 'STYRELSEN',
        postType,
        spots,
        description: 'test',
      },
    });
  unique = await mk('Ordförande', 'U', 1);
  pair = await mk('Sekreterare', 'EXACT_N', 2);
  many = await mk('Phøs', 'EA', -1);
  notElectable = await mk('Ej valbar', 'U', 1);

  for (let i = 0; i < 6; i += 1) {
    const [create, remove] = genRandomUser();
    users.push((await create()).username);
    removeUsers.push(remove);
  }
  users = users.sort();
});

beforeEach(async () => {
  await electionApi.clear();
  const election = await electionApi.createElection(
    'aa0000bb-s',
    [unique.id, pair.id, many.id],
    false,
  );
  electionId = election.id;
  await electionApi.openElection(electionId);

  // users[0..3] are candidates for every post; users[4] never answered, users[5] said no
  for (const post of [unique, pair, many]) {
    for (const u of users.slice(0, 4)) {
      await nominate(u, post.id);
    }
    await nominate(users[4], post.id, NOT_ANSWERED);
    await nominate(users[5], post.id, NO);
  }
  await nominate(users[0], notElectable.id);
});

afterAll(async () => {
  await electionApi.clear();
  await prisma.prismaNomination.deleteMany({ where: { refPost: notElectable.id } });
  await prisma.prismaPost.deleteMany({
    where: { id: { in: [unique, pair, many, notElectable].map((p) => p.id) } },
  });
  await Promise.all(removeUsers.map((r) => r()));
});

describe('deadline', () => {
  test('must be after the election closed', async () => {
    await close();
    const { closedAt } = await prisma.prismaElection.findUniqueOrThrow({
      where: { id: electionId },
    });
    await expect(api.setDeadline(electionId, closedAt as Date, AFTER)).rejects.toThrowError(
      BadRequestError,
    );
    await expect(
      api.setDeadline(electionId, new Date((closedAt as Date).getTime() + 1), AFTER),
    ).resolves.toBeUndefined();
  });

  test('must be in the future while the election is open', async () => {
    const now = new Date();
    await expect(
      api.setDeadline(electionId, new Date(now.getTime() - 1), now),
    ).rejects.toThrowError(BadRequestError);
    await api.setDeadline(electionId, new Date(now.getTime() + HOUR), now);
    const e = await prisma.prismaElection.findUniqueOrThrow({ where: { id: electionId } });
    expect(e.proposalDeadline).toEqual(new Date(now.getTime() + HOUR));
  });

  test('unknown election', async () => {
    await expect(api.setDeadline(-1, new Date(), new Date())).rejects.toThrowError(NotFoundError);
  });
});

describe('proposing', () => {
  test('creates a draft, also while the election is open', async () => {
    await api.propose(electionId, users[0], unique.id);
    expect(await proposal(users[0], unique.id)).toMatchObject({
      status: DRAFT,
      sentAt: null,
      answeredAt: null,
    });
  });

  test('only candidates can be proposed', async () => {
    await expect(api.propose(electionId, users[4], unique.id)).rejects.toThrowError(
      BadRequestError,
    );
    await expect(api.propose(electionId, users[5], unique.id)).rejects.toThrowError(
      BadRequestError,
    );
    await expect(api.propose(electionId, 'Not an user', unique.id)).rejects.toThrowError(
      BadRequestError,
    );
    // Accepted, but the post is not up for election
    await expect(api.propose(electionId, users[0], notElectable.id)).rejects.toThrowError(
      BadRequestError,
    );
    await expect(api.propose(-1, users[0], unique.id)).rejects.toThrowError(NotFoundError);
    expect(await prisma.prismaProposal.count({ where: { refElection: electionId } })).toBe(0);
  });

  test('cannot propose someone already proposed', async () => {
    await api.propose(electionId, users[0], unique.id);
    await expect(api.propose(electionId, users[0], unique.id)).rejects.toThrowError(
      BadRequestError,
    );
    await close();
    await api.sendProposals(electionId, unique.id, NOW);
    await expect(api.propose(electionId, users[0], unique.id, NOW)).rejects.toThrowError(
      BadRequestError,
    );
  });

  test('not after the deadline', async () => {
    await close();
    await expect(api.propose(electionId, users[0], unique.id, AFTER)).rejects.toThrowError(
      BadRequestError,
    );
    await expect(api.propose(electionId, users[0], unique.id, DEADLINE)).rejects.toThrowError(
      BadRequestError,
    );
  });
});

describe('sending', () => {
  test('needs a closed election and a deadline', async () => {
    await api.propose(electionId, users[0], unique.id);
    await expect(api.sendProposals(electionId, unique.id)).rejects.toThrowError(BadRequestError);

    await electionApi.closeElection(electionId);
    await expect(api.sendProposals(electionId, unique.id)).rejects.toThrowError(BadRequestError);
    expect((await proposal(users[0], unique.id))?.status).toBe(DRAFT);
  });

  test('turns the drafts of one post into pending proposals', async () => {
    await close();
    await api.propose(electionId, users[1], pair.id, NOW);
    await api.propose(electionId, users[0], pair.id, NOW);
    await api.propose(electionId, users[2], unique.id, NOW);

    const { usernames, deadline } = await api.sendProposals(electionId, pair.id, NOW);
    expect(usernames).toEqual([users[0], users[1]]);
    expect(deadline).toEqual(DEADLINE);
    expect(await proposal(users[0], pair.id)).toMatchObject({ status: PENDING, sentAt: NOW });
    expect(await proposal(users[1], pair.id)).toMatchObject({ status: PENDING, sentAt: NOW });
    // Other posts are untouched
    expect((await proposal(users[2], unique.id))?.status).toBe(DRAFT);

    // Nothing left to send for the post
    await expect(api.sendProposals(electionId, pair.id, NOW)).rejects.toThrowError(BadRequestError);
  });

  test('not after the deadline', async () => {
    await close();
    await api.propose(electionId, users[0], unique.id, NOW);
    await expect(api.sendProposals(electionId, unique.id, AFTER)).rejects.toThrowError(
      BadRequestError,
    );
  });
});

describe('answering a proposal', () => {
  beforeEach(close);

  test('accepting and declining', async () => {
    await proposeAndSend(pair.id, users[0], users[1]);
    await api.respondToProposal(electionId, pair.id, users[0], true, NOW);
    await api.respondToProposal(electionId, pair.id, users[1], false, NOW);
    expect(await proposal(users[0], pair.id)).toMatchObject({ status: ACCEPTED, answeredAt: NOW });
    expect(await proposal(users[1], pair.id)).toMatchObject({ status: DECLINED, answeredAt: NOW });
    // Declining leaves the nomination, so they are still a candidate
    const overview = await api.getOverview(electionId, NOW);
    expect(overview.find((o) => o.postId === pair.id)?.candidates).toContain(users[1]);
  });

  test('an answer is final', async () => {
    await proposeAndSend(unique.id, users[0]);
    await api.respondToProposal(electionId, unique.id, users[0], true, NOW);
    await expect(
      api.respondToProposal(electionId, unique.id, users[0], false, NOW),
    ).rejects.toThrowError(BadRequestError);
    await expect(
      api.respondToProposal(electionId, unique.id, users[0], true, NOW),
    ).rejects.toThrowError(BadRequestError);
    expect((await proposal(users[0], unique.id))?.status).toBe(ACCEPTED);
  });

  test('drafts and missing proposals cannot be answered', async () => {
    await api.propose(electionId, users[0], unique.id, NOW);
    await expect(
      api.respondToProposal(electionId, unique.id, users[0], true, NOW),
    ).rejects.toThrowError(BadRequestError);
    await expect(
      api.respondToProposal(electionId, unique.id, users[1], true, NOW),
    ).rejects.toThrowError(BadRequestError);
  });

  test('locks at the deadline instant', async () => {
    await proposeAndSend(pair.id, users[0], users[1]);
    const justBefore = new Date(DEADLINE.getTime() - 1);
    await api.respondToProposal(electionId, pair.id, users[0], true, justBefore);
    await expect(
      api.respondToProposal(electionId, pair.id, users[1], true, DEADLINE),
    ).rejects.toThrowError(BadRequestError);
  });
});

describe('removing a proposal', () => {
  beforeEach(close);

  test('a draft is deleted without telling anyone', async () => {
    await api.propose(electionId, users[0], unique.id, NOW);
    await expect(api.removeProposal(electionId, users[0], unique.id, NOW)).resolves.toEqual({
      withdrawn: false,
      notify: false,
    });
    expect(await proposal(users[0], unique.id)).toBeNull();
  });

  test('a sent or accepted proposal is withdrawn and the person told', async () => {
    await proposeAndSend(pair.id, users[0], users[1]);
    await api.respondToProposal(electionId, pair.id, users[0], true, NOW);

    for (const u of [users[0], users[1]]) {
      await expect(api.removeProposal(electionId, u, pair.id, NOW)).resolves.toEqual({
        withdrawn: true,
        notify: true,
      });
      expect((await proposal(u, pair.id))?.status).toBe(WITHDRAWN);
    }
  });

  test('after the deadline it is withdrawn without telling', async () => {
    await proposeAndSend(unique.id, users[0]);
    await api.respondToProposal(electionId, unique.id, users[0], true, NOW);
    await expect(api.removeProposal(electionId, users[0], unique.id, AFTER)).resolves.toEqual({
      withdrawn: true,
      notify: false,
    });
  });

  test('declined, withdrawn and missing proposals cannot be removed', async () => {
    await proposeAndSend(pair.id, users[0], users[1]);
    await api.respondToProposal(electionId, pair.id, users[0], false, NOW);
    await api.removeProposal(electionId, users[1], pair.id, NOW);

    await expect(api.removeProposal(electionId, users[0], pair.id, NOW)).rejects.toThrowError(
      BadRequestError,
    );
    await expect(api.removeProposal(electionId, users[1], pair.id, NOW)).rejects.toThrowError(
      BadRequestError,
    );
    await expect(api.removeProposal(electionId, users[2], pair.id, NOW)).rejects.toThrowError(
      NotFoundError,
    );
  });

  test('pending at the deadline counts as declined and cannot be withdrawn', async () => {
    await proposeAndSend(unique.id, users[0]);
    await expect(api.removeProposal(electionId, users[0], unique.id, AFTER)).rejects.toThrowError(
      BadRequestError,
    );
  });
});

describe('proposing again', () => {
  beforeEach(close);

  test('a declined or withdrawn person goes back to draft', async () => {
    await proposeAndSend(pair.id, users[0], users[1]);
    await api.respondToProposal(electionId, pair.id, users[0], false, NOW);
    await api.removeProposal(electionId, users[1], pair.id, NOW);

    await api.propose(electionId, users[0], pair.id, NOW);
    await api.propose(electionId, users[1], pair.id, NOW);
    expect(await proposal(users[0], pair.id)).toMatchObject({
      status: DRAFT,
      sentAt: null,
      answeredAt: null,
    });

    const later = new Date(NOW.getTime() + 1000);
    await api.sendProposals(electionId, pair.id, later);
    expect(await proposal(users[0], pair.id)).toMatchObject({ status: PENDING, sentAt: later });
    await api.respondToProposal(electionId, pair.id, users[0], true, later);
    expect((await proposal(users[0], pair.id))?.status).toBe(ACCEPTED);
  });
});

describe('pending at the deadline', () => {
  beforeEach(close);

  test('is reported as declined, and as pending before', async () => {
    await proposeAndSend(unique.id, users[0]);
    const before = new Date(DEADLINE.getTime() - 1);

    const [mineBefore] = await api.getMyProposals(electionId, users[0], before);
    expect(mineBefore).toMatchObject({ status: PENDING, expired: false });

    const [mineAt] = await api.getMyProposals(electionId, users[0], DEADLINE);
    expect(mineAt).toMatchObject({ status: DECLINED, expired: true });
    const [all] = await api.getProposals(electionId, AFTER);
    expect(all).toMatchObject({ status: DECLINED, expired: true });

    // The row itself is unchanged; nothing ran at the deadline
    expect((await proposal(users[0], unique.id))?.status).toBe(PENDING);
  });

  test('members do not see drafts', async () => {
    await api.propose(electionId, users[0], unique.id, NOW);
    await expect(api.getMyProposals(electionId, users[0], NOW)).resolves.toEqual([]);
  });
});

describe('opening motkandidering', () => {
  beforeEach(close);

  test('waits until no sent proposal is unanswered', async () => {
    await proposeAndSend(pair.id, users[0], users[1]);
    await expect(api.openCounterCandidacy(electionId, pair.id, NOW)).rejects.toThrowError(
      BadRequestError,
    );
    expect(
      (await api.getOverview(electionId, NOW)).find((o) => o.postId === pair.id),
    ).toMatchObject({ canOpenCounterCandidacy: false, acceptedCount: 0 });

    await api.respondToProposal(electionId, pair.id, users[0], true, NOW);
    await api.respondToProposal(electionId, pair.id, users[1], false, NOW);

    // 1 of 2 accepted and nothing pending: the committee can open
    expect(
      (await api.getOverview(electionId, NOW)).find((o) => o.postId === pair.id),
    ).toMatchObject({ canOpenCounterCandidacy: true, acceptedCount: 1 });

    // A replacement is sent, so it is blocked again
    await proposeAndSend(pair.id, users[2]);
    expect(
      (await api.getOverview(electionId, NOW)).find((o) => o.postId === pair.id),
    ).toMatchObject({ canOpenCounterCandidacy: false, acceptedCount: 1 });
    await api.respondToProposal(electionId, pair.id, users[2], true, NOW);
    expect(
      (await api.getOverview(electionId, NOW)).find((o) => o.postId === pair.id),
    ).toMatchObject({ canOpenCounterCandidacy: true, acceptedCount: 2 });
  });

  test('tells only candidates who were never proposed', async () => {
    await proposeAndSend(pair.id, users[0], users[1], users[2]);
    await api.respondToProposal(electionId, pair.id, users[0], true, NOW);
    await api.respondToProposal(electionId, pair.id, users[1], false, NOW);
    await api.removeProposal(electionId, users[2], pair.id, NOW);

    const { usernames, deadline } = await api.openCounterCandidacy(electionId, pair.id, NOW);
    // Not the accepted, declined or withdrawn, and not the non-candidates users[4], users[5]
    expect(usernames).toEqual([users[3]]);
    expect(deadline).toEqual(DEADLINE);

    const [o] = (await api.getOverview(electionId, NOW)).filter((p) => p.postId === pair.id);
    expect(o).toMatchObject({ counterCandidacyOpenedAt: NOW, canOpenCounterCandidacy: false });
  });

  test('works on a vacant post', async () => {
    const { usernames } = await api.openCounterCandidacy(electionId, unique.id, NOW);
    expect(usernames).toEqual(users.slice(0, 4));
  });

  test('a draft does not block it', async () => {
    await api.propose(electionId, users[0], many.id, NOW);
    const { usernames } = await api.openCounterCandidacy(electionId, many.id, NOW);
    // A draft still counts as proposed
    expect(usernames).toEqual(users.slice(1, 4));
  });

  test('only once', async () => {
    await api.openCounterCandidacy(electionId, unique.id, NOW);
    await expect(api.openCounterCandidacy(electionId, unique.id, NOW)).rejects.toThrowError(
      BadRequestError,
    );
  });

  test('needs a closed election, a deadline that has not passed and an electable post', async () => {
    await expect(api.openCounterCandidacy(electionId, unique.id, AFTER)).rejects.toThrowError(
      BadRequestError,
    );
    await expect(api.openCounterCandidacy(electionId, notElectable.id, NOW)).rejects.toThrowError(
      BadRequestError,
    );
    expect(
      (await api.getOverview(electionId, AFTER)).every((o) => !o.canOpenCounterCandidacy),
    ).toBe(true);
  });

  test('cannot open before closing', async () => {
    await electionApi.clear();
    const e = await electionApi.createElection('aa0000bb-s', [unique.id], false);
    await electionApi.openElection(e.id);
    await api.setDeadline(e.id, new Date(Date.now() + HOUR));
    await expect(api.openCounterCandidacy(e.id, unique.id)).rejects.toThrowError(BadRequestError);
  });

  test('without a deadline', async () => {
    await electionApi.clear();
    const e = await electionApi.createElection('aa0000bb-s', [unique.id], false);
    await electionApi.openElection(e.id);
    await electionApi.closeElection(e.id);
    await expect(api.openCounterCandidacy(e.id, unique.id)).rejects.toThrowError(BadRequestError);
    expect((await api.getOverview(e.id))[0].canOpenCounterCandidacy).toBe(false);
  });
});

describe('answering motkandidering', () => {
  beforeEach(close);

  test('only when open for the post', async () => {
    await expect(
      api.respondToCounterCandidacy(electionId, unique.id, users[0], true, NOW),
    ).rejects.toThrowError(BadRequestError);
    await expect(api.getMyCounterCandidacies(electionId, users[0], NOW)).resolves.toEqual([]);
  });

  test('candidates answer and change their mind until the deadline', async () => {
    await api.openCounterCandidacy(electionId, unique.id, NOW);
    expect(await api.getMyCounterCandidacies(electionId, users[3], NOW)).toEqual([
      { postId: unique.id, answer: NOT_ANSWERED, canRespond: true },
    ]);

    await api.respondToCounterCandidacy(electionId, unique.id, users[3], true, NOW);
    expect(await counterAnswer(users[3], unique.id)).toBe(YES);
    await api.respondToCounterCandidacy(electionId, unique.id, users[3], false, NOW);
    expect(await counterAnswer(users[3], unique.id)).toBe(NO);
    await api.respondToCounterCandidacy(electionId, unique.id, users[3], true, NOW);
    expect(await counterAnswer(users[3], unique.id)).toBe(YES);

    await expect(
      api.respondToCounterCandidacy(electionId, unique.id, users[3], false, DEADLINE),
    ).rejects.toThrowError(BadRequestError);
    expect(await api.getMyCounterCandidacies(electionId, users[3], AFTER)).toEqual([
      { postId: unique.id, answer: YES, canRespond: false },
    ]);
    // Never answered: nothing is shown after the deadline
    expect(await api.getMyCounterCandidacies(electionId, users[2], AFTER)).toEqual([]);
  });

  test('non-candidates cannot answer', async () => {
    await api.openCounterCandidacy(electionId, unique.id, NOW);
    for (const u of [users[4], users[5]]) {
      await expect(
        api.respondToCounterCandidacy(electionId, unique.id, u, true, NOW),
      ).rejects.toThrowError(BadRequestError);
      await expect(api.getMyCounterCandidacies(electionId, u, NOW)).resolves.toEqual([]);
    }
  });

  test('declined and withdrawn candidates can answer without being told', async () => {
    await proposeAndSend(pair.id, users[0], users[1]);
    await api.respondToProposal(electionId, pair.id, users[0], true, NOW);
    await api.respondToProposal(electionId, pair.id, users[1], false, NOW);
    await api.openCounterCandidacy(electionId, pair.id, NOW);

    // Withdrawn after it opened
    await api.removeProposal(electionId, users[0], pair.id, NOW);

    for (const u of [users[0], users[1]]) {
      expect(await api.getMyCounterCandidacies(electionId, u, NOW)).toEqual([
        { postId: pair.id, answer: NOT_ANSWERED, canRespond: true },
      ]);
      await api.respondToCounterCandidacy(electionId, pair.id, u, true, NOW);
      expect(await counterAnswer(u, pair.id)).toBe(YES);
    }
  });

  test('a pending or accepted proposal blocks it', async () => {
    await proposeAndSend(pair.id, users[0]);
    await api.respondToProposal(electionId, pair.id, users[0], true, NOW);
    await api.openCounterCandidacy(electionId, pair.id, NOW);
    await proposeAndSend(pair.id, users[1]);

    for (const u of [users[0], users[1]]) {
      await expect(
        api.respondToCounterCandidacy(electionId, pair.id, u, true, NOW),
      ).rejects.toThrowError(BadRequestError);
      await expect(api.getMyCounterCandidacies(electionId, u, NOW)).resolves.toEqual([]);
    }
  });
});

describe('a motkandidat who is proposed', () => {
  beforeEach(async () => {
    await close();
    await proposeAndSend(pair.id, users[0], users[1]);
    await api.respondToProposal(electionId, pair.id, users[0], true, NOW);
    await api.respondToProposal(electionId, pair.id, users[1], true, NOW);
    await api.openCounterCandidacy(electionId, pair.id, NOW);
    await api.respondToCounterCandidacy(electionId, pair.id, users[3], true, NOW);

    // The committee withdraws one and proposes the motkandidat instead
    await api.removeProposal(electionId, users[0], pair.id, NOW);
    await proposeAndSend(pair.id, users[3]);
  });

  test('keeps the answer while the proposal is pending', async () => {
    expect(await counterAnswer(users[3], pair.id)).toBe(YES);
    await expect(api.getMyCounterCandidacies(electionId, users[3], NOW)).resolves.toEqual([]);
  });

  test('accepting makes them proposed instead', async () => {
    await api.respondToProposal(electionId, pair.id, users[3], true, NOW);
    expect(await counterAnswer(users[3], pair.id)).toBeUndefined();
    expect((await proposal(users[3], pair.id))?.status).toBe(ACCEPTED);
  });

  test('declining leaves them out, but they can say yes again', async () => {
    await api.respondToProposal(electionId, pair.id, users[3], false, NOW);
    expect(await counterAnswer(users[3], pair.id)).toBeUndefined();
    expect(await api.getMyCounterCandidacies(electionId, users[3], NOW)).toEqual([
      { postId: pair.id, answer: NOT_ANSWERED, canRespond: true },
    ]);
    await api.respondToCounterCandidacy(electionId, pair.id, users[3], true, NOW);
    expect(await counterAnswer(users[3], pair.id)).toBe(YES);
  });
});

describe('overview', () => {
  beforeEach(close);

  test('lists every electable post with candidates, proposals and answers', async () => {
    await proposeAndSend(many.id, users[0], users[1]);
    await api.respondToProposal(electionId, many.id, users[0], true, NOW);
    await api.respondToProposal(electionId, many.id, users[1], true, NOW);
    await api.openCounterCandidacy(electionId, many.id, NOW);
    await api.respondToCounterCandidacy(electionId, many.id, users[2], true, NOW);
    await api.respondToCounterCandidacy(electionId, many.id, users[3], false, NOW);

    const overview = await api.getOverview(electionId, NOW);
    expect(overview.map((o) => o.postId).sort()).toEqual([unique.id, pair.id, many.id].sort());
    const o = overview.find((p) => p.postId === many.id);
    expect(o?.candidates).toEqual(users.slice(0, 4));
    expect(o?.acceptedCount).toBe(2);
    expect(o?.proposals.map((p) => [p.refUser, p.status])).toEqual([
      [users[0], ACCEPTED],
      [users[1], ACCEPTED],
    ]);
    expect(o?.counterCandidacies.map((c) => [c.refUser, c.answer])).toEqual([
      [users[2], YES],
      [users[3], NO],
    ]);
  });
});

describe('manual admin changes', () => {
  beforeEach(close);

  test('work before the deadline too', async () => {
    await proposeAndSend(unique.id, users[0]);
    // A yes by phone before the person answered on the site
    await api.setProposalStatus(electionId, users[0], unique.id, ACCEPTED, NOW);
    expect(await proposal(users[0], unique.id)).toMatchObject({
      status: ACCEPTED,
      answeredAt: NOW,
    });
    // No longer pending, so the person cannot answer it themselves
    await expect(
      api.respondToProposal(electionId, unique.id, users[0], false, NOW),
    ).rejects.toThrowError(BadRequestError);

    await api.setCounterCandidacy(electionId, users[1], unique.id, true, NOW);
    expect(await counterAnswer(users[1], unique.id)).toBe(YES);
  });

  test('set a proposal status, and accepting clears motkandidering', async () => {
    await proposeAndSend(pair.id, users[0], users[1]);
    await api.respondToProposal(electionId, pair.id, users[1], false, NOW);
    await api.setCounterCandidacy(electionId, users[1], pair.id, true, AFTER);

    // users[0] never answered; the committee got a yes by phone
    await api.setProposalStatus(electionId, users[0], pair.id, ACCEPTED, AFTER);
    expect((await proposal(users[0], pair.id))?.status).toBe(ACCEPTED);

    await api.setProposalStatus(electionId, users[1], pair.id, ACCEPTED, AFTER);
    expect(await counterAnswer(users[1], pair.id)).toBeUndefined();

    await api.setProposalStatus(electionId, users[1], pair.id, WITHDRAWN, AFTER);
    expect((await proposal(users[1], pair.id))?.status).toBe(WITHDRAWN);
  });

  test('cannot set draft or pending, or change a missing proposal', async () => {
    await proposeAndSend(unique.id, users[0]);
    for (const status of [DRAFT, PENDING]) {
      await expect(
        api.setProposalStatus(electionId, users[0], unique.id, status, AFTER),
      ).rejects.toThrowError(BadRequestError);
    }
    await expect(
      api.setProposalStatus(electionId, users[1], unique.id, ACCEPTED, AFTER),
    ).rejects.toThrowError(NotFoundError);
  });

  test('set and clear a motkandidat answer', async () => {
    await api.setCounterCandidacy(electionId, users[2], unique.id, true, AFTER);
    expect(await counterAnswer(users[2], unique.id)).toBe(YES);
    await api.setCounterCandidacy(electionId, users[2], unique.id, false, AFTER);
    expect(await counterAnswer(users[2], unique.id)).toBe(NO);
    await api.setCounterCandidacy(electionId, users[2], unique.id, null, AFTER);
    expect(await counterAnswer(users[2], unique.id)).toBeUndefined();

    // Not a candidate, or already accepted a proposal
    await expect(
      api.setCounterCandidacy(electionId, users[4], unique.id, true, AFTER),
    ).rejects.toThrowError(BadRequestError);
    await proposeAndSend(pair.id, users[0]);
    await api.respondToProposal(electionId, pair.id, users[0], true, NOW);
    await expect(
      api.setCounterCandidacy(electionId, users[0], pair.id, true, AFTER),
    ).rejects.toThrowError(BadRequestError);
  });
});
