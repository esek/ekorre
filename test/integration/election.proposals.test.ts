import prisma from '@/api/prisma';
import tokenProvider from '@/auth';
import config from '@/config';
import { ElectionAPI } from '@api/election';
import { Feature } from '@generated/graphql';
import { PrismaNominationAnswer, PrismaPost, PrismaUser } from '@prisma/client';
import { sendEmail } from '@service/email';
import { formatDeadline } from '@service/proposal-mail';
import requestWithAuth from '@test/utils/requestWithAuth';
import { genRandomUser } from '@test/utils/utils';

jest.mock('@service/email', () => ({ sendEmail: jest.fn() }));

const mockedSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
const electionApi = new ElectionAPI();

let admin: PrismaUser;
let member: PrismaUser;
/** Candidates for both posts */
let candidates: PrismaUser[];
let post: PrismaPost;
let otherPost: PrismaPost;
let electionId: number;
let deadline: Date;
const cleanup: (() => Promise<void>)[] = [];

const token = (u: PrismaUser) => tokenProvider.issueToken(u.username, 'access_token');
const gql = (query: string, variables: Record<string, unknown>, as: PrismaUser) =>
  requestWithAuth(query, variables, token(as));

type Mail = { to: string[]; subject: string; template: string; overrides: Record<string, unknown> };

const mails = (): Mail[] =>
  mockedSendEmail.mock.calls.map(([to, subject, template, overrides]) => ({
    to: Array.isArray(to) ? to : [to],
    subject,
    template,
    overrides,
  }));

const PROPOSE = `mutation ($e: Int!, $u: String!, $p: Int!) { propose(electionId: $e, username: $u, postId: $p) }`;
const REMOVE = `mutation ($e: Int!, $u: String!, $p: Int!) { removeProposal(electionId: $e, username: $u, postId: $p) }`;
const SEND = `mutation ($e: Int!, $p: Int!) { sendProposals(electionId: $e, postId: $p) }`;
const RESPOND = `mutation ($e: Int!, $p: Int!, $a: Boolean!) { respondToProposal(electionId: $e, postId: $p, accepts: $a) }`;
const OPEN = `mutation ($e: Int!, $p: Int!) { openCounterCandidacy(electionId: $e, postId: $p) }`;
const COUNTER = `mutation ($e: Int!, $p: Int!, $a: Boolean!) { respondToCounterCandidacy(electionId: $e, postId: $p, accepts: $a) }`;
const DEADLINE = `mutation ($e: Int!, $d: DateTime!) { setProposalDeadline(electionId: $e, deadline: $d) }`;
const SET_STATUS = `mutation ($e: Int!, $u: String!, $p: Int!, $s: ProposalStatus!) { setProposalStatus(electionId: $e, username: $u, postId: $p, status: $s) }`;
const SET_COUNTER = `mutation ($e: Int!, $u: String!, $p: Int!, $a: Boolean) { setCounterCandidacy(electionId: $e, username: $u, postId: $p, answer: $a) }`;
const OVERVIEW = `query ($e: Int!) {
  proposalOverview(electionId: $e) {
    post { id postname }
    proposals { user { username } status sentAt answeredAt expired }
    candidates { username firstName }
    acceptedCount counterCandidacyOpenedAt canOpenCounterCandidacy
    counterCandidacies { user { username } post { id } answer answeredAt }
  }
}`;
const MINE = `query ($e: Int!) {
  myProposals(electionId: $e) { post { id postname } status expired }
  myCounterCandidacies(electionId: $e) { post { id } answer canRespond }
  election(electionId: $e) { proposalDeadline }
}`;
const PROPOSALS = `query ($e: Int!) { election(electionId: $e) { proposals { user { username } post { id } status } } }`;

const ok = async (query: string, variables: Record<string, unknown>, as: PrismaUser) => {
  const res = await gql(query, variables, as);
  expect(res.errors).toBeUndefined();
  return res.data as Record<string, unknown>;
};

const vars = (u: PrismaUser, p: PrismaPost = post) => ({ e: electionId, u: u.username, p: p.id });

beforeAll(async () => {
  const suffix = Date.now().toString(36);
  const mk = (name: string) =>
    prisma.prismaPost.create({
      data: {
        postname: `${name} ${suffix}`,
        utskott: 'STYRELSEN',
        postType: 'EXACT_N',
        spots: 2,
        description: 'test',
      },
    });
  post = await mk('Sekreterare');
  otherPost = await mk('Kassör');

  const create = async (access: Feature[] = []) => {
    const [c, r] = genRandomUser(access);
    cleanup.push(r);
    return c();
  };
  admin = await create([Feature.ElectionAdmin]);
  member = await create();
  candidates = [];
  for (let i = 0; i < 4; i += 1) {
    candidates.push(await create());
  }
});

beforeEach(async () => {
  mockedSendEmail.mockReset();
  await electionApi.clear();
  const e = await electionApi.createElection(admin.username, [post.id, otherPost.id], false);
  electionId = e.id;
  await electionApi.openElection(electionId);
  await prisma.prismaNomination.createMany({
    data: candidates.flatMap((u) =>
      [post, otherPost].map((p) => ({
        refElection: electionId,
        refUser: u.username,
        refPost: p.id,
        answer: PrismaNominationAnswer.YES,
      })),
    ),
  });
  await electionApi.closeElection(electionId);
  deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await ok(DEADLINE, { e: electionId, d: deadline.toISOString() }, admin);
});

afterAll(async () => {
  await electionApi.clear();
  await prisma.prismaPost.deleteMany({ where: { id: { in: [post.id, otherPost.id] } } });
  await Promise.all(cleanup.map((c) => c()));
});

describe('access', () => {
  test('members cannot do the committee work', async () => {
    const attempts: [string, Record<string, unknown>][] = [
      [OVERVIEW, { e: electionId }],
      [PROPOSE, vars(candidates[0])],
      [REMOVE, vars(candidates[0])],
      [SEND, { e: electionId, p: post.id }],
      [OPEN, { e: electionId, p: post.id }],
      [DEADLINE, { e: electionId, d: deadline.toISOString() }],
      [SET_STATUS, { ...vars(candidates[0]), s: 'ACCEPTED' }],
      [SET_COUNTER, { ...vars(candidates[0]), a: true }],
    ];
    for (const [query, variables] of attempts) {
      const res = await gql(query, variables, member);
      expect(res.errors?.[0]).toMatchObject({ errorType: 'ForbiddenError' });
    }
  });

  test('members see no proposals of the election, not even accepted ones', async () => {
    await ok(PROPOSE, vars(candidates[0]), admin);
    await ok(PROPOSE, vars(candidates[1]), admin);
    await ok(PROPOSE, vars(candidates[2], otherPost), admin);
    await ok(SEND, { e: electionId, p: post.id }, admin);
    await ok(RESPOND, { e: electionId, p: post.id, a: true }, candidates[0]);
    await ok(RESPOND, { e: electionId, p: post.id, a: false }, candidates[1]);

    type Proposals = { election: { proposals: { status: string }[] } };
    for (const u of [member, candidates[0]]) {
      const res = (await ok(PROPOSALS, { e: electionId }, u)) as Proposals;
      expect(res.election.proposals).toEqual([]);
    }

    const asAdmin = (await ok(PROPOSALS, { e: electionId }, admin)) as Proposals;
    expect(asAdmin.election.proposals.map((p) => p.status).sort()).toEqual([
      'ACCEPTED',
      'DECLINED',
      'DRAFT',
    ]);
  });

  test("a member's own view has no drafts and nothing of others", async () => {
    await ok(PROPOSE, vars(candidates[0]), admin);
    await ok(PROPOSE, vars(candidates[1], otherPost), admin);
    await ok(SEND, { e: electionId, p: otherPost.id }, admin);

    const mine0 = (await ok(MINE, { e: electionId }, candidates[0])) as {
      myProposals: unknown[];
    };
    expect(mine0.myProposals).toEqual([]);
    const mine1 = (await ok(MINE, { e: electionId }, candidates[1])) as {
      myProposals: { post: { id: number }; status: string }[];
      election: { proposalDeadline: string };
    };
    expect(mine1.myProposals).toEqual([
      {
        post: { id: otherPost.id, postname: otherPost.postname },
        status: 'PENDING',
        expired: false,
      },
    ]);
    expect(new Date(mine1.election.proposalDeadline)).toEqual(deadline);
  });
});

describe('mail', () => {
  test('sending mails each proposed person a link to their nominations', async () => {
    await ok(PROPOSE, vars(candidates[0]), admin);
    await ok(PROPOSE, vars(candidates[1]), admin);
    expect(mails()).toHaveLength(0);

    const sent = (await ok(SEND, { e: electionId, p: post.id }, admin)) as {
      sendProposals: number;
    };
    expect(sent.sendProposals).toBe(2);
    const m = mails();
    expect(m.map((x) => x.to[0]).sort()).toEqual([candidates[0].email, candidates[1].email].sort());
    expect(m[0]).toMatchObject({
      template: 'election-proposal',
      subject: `Valberedningen föreslår dig till ${post.postname}`,
      overrides: {
        heading: 'Valberedningen föreslår dig',
        posts: [post.postname],
        deadline: formatDeadline(deadline),
        buttonText: 'Svara på förslaget',
        buttonLink: `${config.WEBSITE_URL}/member/election/mine/${electionId}`,
      },
    });
  });

  test('answering sends nothing', async () => {
    await ok(PROPOSE, vars(candidates[0]), admin);
    await ok(SEND, { e: electionId, p: post.id }, admin);
    mockedSendEmail.mockReset();
    await ok(RESPOND, { e: electionId, p: post.id, a: true }, candidates[0]);
    expect(mails()).toHaveLength(0);
  });

  test('withdrawing tells the person, removing a draft does not', async () => {
    await ok(PROPOSE, vars(candidates[0]), admin);
    await ok(SEND, { e: electionId, p: post.id }, admin);
    await ok(RESPOND, { e: electionId, p: post.id, a: true }, candidates[0]);
    await ok(PROPOSE, vars(candidates[1]), admin);
    mockedSendEmail.mockReset();

    await ok(REMOVE, vars(candidates[1]), admin);
    expect(mails()).toHaveLength(0);

    await ok(REMOVE, vars(candidates[0]), admin);
    expect(mails()).toEqual([
      expect.objectContaining({
        to: [candidates[0].email],
        template: 'election-proposal',
        subject: `Valberedningens förslag till ${post.postname} är återkallat`,
      }),
    ]);
  });

  test('opening motkandidering tells only candidates never proposed', async () => {
    await ok(PROPOSE, vars(candidates[0]), admin);
    await ok(PROPOSE, vars(candidates[1]), admin);
    await ok(SEND, { e: electionId, p: post.id }, admin);
    await ok(RESPOND, { e: electionId, p: post.id, a: true }, candidates[0]);
    await ok(RESPOND, { e: electionId, p: post.id, a: false }, candidates[1]);
    mockedSendEmail.mockReset();

    await ok(OPEN, { e: electionId, p: post.id }, admin);
    const m = mails();
    expect(m.map((x) => x.to[0]).sort()).toEqual([candidates[2].email, candidates[3].email].sort());
    expect(m[0]).toMatchObject({
      template: 'election-proposal',
      subject: `Vill du motkandidera till ${post.postname}?`,
      overrides: {
        deadline: formatDeadline(deadline),
        buttonLink: `${config.WEBSITE_URL}/member/election/mine/${electionId}`,
      },
    });
  });

  test('a failing mail does not undo the change', async () => {
    mockedSendEmail.mockRejectedValue(new Error('ebrev is down'));
    await ok(PROPOSE, vars(candidates[0]), admin);
    await ok(SEND, { e: electionId, p: post.id }, admin);
    const mine = (await ok(MINE, { e: electionId }, candidates[0])) as {
      myProposals: { status: string }[];
    };
    expect(mine.myProposals[0].status).toBe('PENDING');
  });
});

describe('the whole flow', () => {
  test('decline, replacement, motkandidering and the overview', async () => {
    // Proposed: 0 and 1. 1 declines, 2 replaces. 3 runs as motkandidat, and so does 1
    await ok(PROPOSE, vars(candidates[0]), admin);
    await ok(PROPOSE, vars(candidates[1]), admin);
    await ok(SEND, { e: electionId, p: post.id }, admin);
    await ok(RESPOND, { e: electionId, p: post.id, a: true }, candidates[0]);
    await ok(RESPOND, { e: electionId, p: post.id, a: false }, candidates[1]);

    type Overview = {
      proposalOverview: {
        post: { id: number };
        proposals: { user: { username: string }; status: string }[];
        candidates: { username: string; firstName: string }[];
        acceptedCount: number;
        canOpenCounterCandidacy: boolean;
        counterCandidacyOpenedAt: string | null;
        counterCandidacies: { user: { username: string }; answer: string }[];
      }[];
    };
    const overview = async () =>
      ((await ok(OVERVIEW, { e: electionId }, admin)) as Overview).proposalOverview.find(
        (o) => o.post.id === post.id,
      );

    expect(await overview()).toMatchObject({ acceptedCount: 1, canOpenCounterCandidacy: true });

    await ok(PROPOSE, vars(candidates[2]), admin);
    await ok(SEND, { e: electionId, p: post.id }, admin);
    expect(await overview()).toMatchObject({ canOpenCounterCandidacy: false });
    await ok(RESPOND, { e: electionId, p: post.id, a: true }, candidates[2]);

    await ok(OPEN, { e: electionId, p: post.id }, admin);
    await ok(COUNTER, { e: electionId, p: post.id, a: true }, candidates[3]);
    await ok(COUNTER, { e: electionId, p: post.id, a: true }, candidates[1]);

    // Someone accepted cannot also run against the proposal
    const blocked = await gql(COUNTER, { e: electionId, p: post.id, a: true }, candidates[0]);
    expect(blocked.errors?.[0]).toMatchObject({ errorType: 'BadRequestError' });

    const o = await overview();
    expect(o?.acceptedCount).toBe(2);
    expect(o?.counterCandidacyOpenedAt).not.toBeNull();
    expect(o?.candidates.map((c) => c.username).sort()).toEqual(
      candidates.map((c) => c.username).sort(),
    );
    expect(o?.candidates[0].firstName).toBeTruthy();
    expect(o?.counterCandidacies.map((c) => c.user.username).sort()).toEqual(
      [candidates[1].username, candidates[3].username].sort(),
    );

    const mine = (await ok(MINE, { e: electionId }, candidates[3])) as {
      myCounterCandidacies: { post: { id: number }; answer: string; canRespond: boolean }[];
    };
    expect(mine.myCounterCandidacies).toEqual([
      { post: { id: post.id }, answer: 'YES', canRespond: true },
    ]);
  });

  test('admin overrides are refused before the deadline', async () => {
    await ok(PROPOSE, vars(candidates[0]), admin);
    await ok(SEND, { e: electionId, p: post.id }, admin);
    const res = await gql(SET_STATUS, { ...vars(candidates[0]), s: 'ACCEPTED' }, admin);
    expect(res.errors?.[0]).toMatchObject({ errorType: 'BadRequestError' });
  });

  test('a deadline before the election closed is refused', async () => {
    const res = await gql(DEADLINE, { e: electionId, d: new Date(0).toISOString() }, admin);
    expect(res.errors?.[0]).toMatchObject({ errorType: 'BadRequestError' });
  });
});
