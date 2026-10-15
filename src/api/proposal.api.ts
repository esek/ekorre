/**
 * Valberedningens förslag and motkandidering, after the nomination period has ended.
 *
 * A proposal goes DRAFT → PENDING (sent) → ACCEPTED | DECLINED, and the committee can
 * withdraw a sent or accepted one (WITHDRAWN). Once a post has no pending proposals the
 * committee can open motkandidering for it, and candidates without a pending or accepted
 * proposal can then say whether they run as motkandidat.
 *
 * Everything locks for members at the election's `proposalDeadline`. A proposal still
 * pending then counts as declined; this is computed when read, nothing is scheduled.
 * After the deadline only admins can change statuses and motkandidat answers.
 */
import { BadRequestError, NotFoundError } from '@/errors/request.errors';
import { devGuard } from '@/util';
import {
  Prisma,
  PrismaCounterCandidacy,
  PrismaElection,
  PrismaNominationAnswer,
  PrismaProposal,
  PrismaProposalStatus,
} from '@prisma/client';

import prisma from './prisma';

type Tx = Prisma.TransactionClient;

export type EffectiveProposal = PrismaProposal & {
  /** Was still pending when the deadline passed, and is reported as declined */
  expired: boolean;
};

export type PostOverview = {
  postId: number;
  proposals: EffectiveProposal[];
  candidates: string[];
  acceptedCount: number;
  counterCandidacyOpenedAt: Date | null;
  canOpenCounterCandidacy: boolean;
  counterCandidacies: PrismaCounterCandidacy[];
};

export type CounterCandidacyOption = {
  postId: number;
  answer: PrismaNominationAnswer;
  canRespond: boolean;
};

export type RemovalResult = {
  /** The proposal was sent or accepted and is now withdrawn, rather than a deleted draft */
  withdrawn: boolean;
  /** The person should be told, which only happens before the deadline */
  notify: boolean;
};

/** Who to mail after a committee action, and the deadline to tell them */
export type Recipients = {
  usernames: string[];
  deadline: Date;
};

const { DRAFT, PENDING, ACCEPTED, DECLINED, WITHDRAWN } = PrismaProposalStatus;

export const isPastDeadline = (election: Pick<PrismaElection, 'proposalDeadline'>, now: Date) =>
  election.proposalDeadline != null && now.getTime() >= election.proposalDeadline.getTime();

/** The status members and admins see: pending past the deadline counts as declined */
export const effectiveProposal = (
  proposal: PrismaProposal,
  election: Pick<PrismaElection, 'proposalDeadline'>,
  now: Date,
): EffectiveProposal => {
  const expired = proposal.status === PENDING && isPastDeadline(election, now);
  return { ...proposal, status: expired ? DECLINED : proposal.status, expired };
};

const isClosed = (election: PrismaElection) => !election.open && election.closedAt != null;

export class ProposalAPI {
  private async election(electionId: number, tx: Tx = prisma): Promise<PrismaElection> {
    const election = await tx.prismaElection.findUnique({ where: { id: electionId } });
    if (!election) {
      throw new NotFoundError('Valet finns inte');
    }
    return election;
  }

  private assertBeforeDeadline(election: PrismaElection, now: Date) {
    if (isPastDeadline(election, now)) {
      throw new BadRequestError('Deadline för förslag och motkandidering har passerat');
    }
  }

  /** Sending and motkandidering need a closed election and a deadline that has not passed */
  private assertCommitteeCanAct(election: PrismaElection, now: Date) {
    if (!isClosed(election)) {
      throw new BadRequestError('Valet måste vara stängt innan förslag kan skickas');
    }
    if (election.proposalDeadline == null) {
      throw new BadRequestError('Sätt en deadline för förslag och motkandidering först');
    }
    this.assertBeforeDeadline(election, now);
  }

  private assertAfterDeadline(election: PrismaElection, now: Date) {
    if (!isPastDeadline(election, now)) {
      throw new BadRequestError('Detta kan bara ändras manuellt efter deadline');
    }
  }

  private async assertElectable(tx: Tx, electionId: number, postId: number) {
    const electable = await tx.prismaElectable.findUnique({
      where: { refElection_refPost: { refElection: electionId, refPost: postId } },
    });
    if (!electable) {
      throw new BadRequestError('Posten är inte valbar i detta val');
    }
  }

  /** Candidates are users with an accepted nomination for an electable post */
  private async candidates(tx: Tx, electionId: number, postId: number): Promise<string[]> {
    const rows = await tx.prismaNomination.findMany({
      select: { refUser: true },
      where: {
        refElection: electionId,
        refPost: postId,
        answer: PrismaNominationAnswer.YES,
        election: { electables: { some: { refPost: postId } } },
      },
      orderBy: { refUser: 'asc' },
    });
    return rows.map((r) => r.refUser);
  }

  private async assertCandidate(tx: Tx, electionId: number, postId: number, username: string) {
    const nomination = await tx.prismaNomination.findUnique({
      where: {
        refElection_refPost_refUser: {
          refElection: electionId,
          refPost: postId,
          refUser: username,
        },
      },
    });
    if (nomination?.answer !== PrismaNominationAnswer.YES) {
      throw new BadRequestError('Personen har inte accepterat en nominering till posten');
    }
    await this.assertElectable(tx, electionId, postId);
  }

  private findProposal(tx: Tx, electionId: number, postId: number, username: string) {
    return tx.prismaProposal.findUnique({
      where: {
        refElection_refPost_refUser: {
          refElection: electionId,
          refPost: postId,
          refUser: username,
        },
      },
    });
  }

  async setDeadline(electionId: number, deadline: Date, now = new Date()): Promise<void> {
    const election = await this.election(electionId);
    const earliest = election.closedAt ?? now;
    if (deadline.getTime() <= earliest.getTime()) {
      throw new BadRequestError(
        election.closedAt
          ? 'Deadline måste vara efter att valet stängdes'
          : 'Deadline måste vara i framtiden',
      );
    }
    await prisma.prismaElection.update({
      where: { id: electionId },
      data: { proposalDeadline: deadline },
    });
  }

  /**
   * Adds a draft proposal, or turns a declined or withdrawn one back into a draft so the
   * person can be proposed again
   */
  async propose(electionId: number, username: string, postId: number, now = new Date()) {
    await prisma.$transaction(async (tx) => {
      const election = await this.election(electionId, tx);
      this.assertBeforeDeadline(election, now);
      await this.assertCandidate(tx, electionId, postId, username);

      const existing = await this.findProposal(tx, electionId, postId, username);
      if (!existing) {
        await tx.prismaProposal.create({
          data: { refElection: electionId, refPost: postId, refUser: username, status: DRAFT },
        });
        return;
      }
      if (existing.status !== DECLINED && existing.status !== WITHDRAWN) {
        throw new BadRequestError('Personen är redan föreslagen till posten');
      }
      await tx.prismaProposal.update({
        where: {
          refElection_refPost_refUser: {
            refElection: electionId,
            refPost: postId,
            refUser: username,
          },
        },
        data: { status: DRAFT, sentAt: null, answeredAt: null },
      });
    });
  }

  /** Deletes a draft, or withdraws a sent or accepted proposal */
  async removeProposal(
    electionId: number,
    username: string,
    postId: number,
    now = new Date(),
  ): Promise<RemovalResult> {
    return prisma.$transaction(async (tx) => {
      const election = await this.election(electionId, tx);
      const row = await this.findProposal(tx, electionId, postId, username);
      if (!row) {
        throw new NotFoundError('Förslaget finns inte');
      }
      const proposal = effectiveProposal(row, election, now);
      const where = {
        refElection_refPost_refUser: {
          refElection: electionId,
          refPost: postId,
          refUser: username,
        },
      };

      if (proposal.status === DRAFT) {
        await tx.prismaProposal.delete({ where });
        return { withdrawn: false, notify: false };
      }
      if (proposal.status !== PENDING && proposal.status !== ACCEPTED) {
        throw new BadRequestError('Personen är inte längre föreslagen till posten');
      }
      await tx.prismaProposal.update({ where, data: { status: WITHDRAWN, answeredAt: now } });
      return { withdrawn: true, notify: !isPastDeadline(election, now) };
    });
  }

  /** Sends every draft for the post. Returns who was sent a proposal, and the deadline */
  async sendProposals(electionId: number, postId: number, now = new Date()): Promise<Recipients> {
    return prisma.$transaction(async (tx) => {
      const election = await this.election(electionId, tx);
      this.assertCommitteeCanAct(election, now);

      const drafts = await tx.prismaProposal.findMany({
        where: { refElection: electionId, refPost: postId, status: DRAFT },
        orderBy: { refUser: 'asc' },
      });
      if (drafts.length === 0) {
        throw new BadRequestError('Det finns inga utkast att skicka för posten');
      }
      await tx.prismaProposal.updateMany({
        where: { refElection: electionId, refPost: postId, status: DRAFT },
        data: { status: PENDING, sentAt: now },
      });
      return {
        usernames: drafts.map((d) => d.refUser),
        deadline: election.proposalDeadline as Date,
      };
    });
  }

  /** The proposed person's answer. Either way, any motkandidat answer for the post is cleared */
  async respondToProposal(
    electionId: number,
    postId: number,
    username: string,
    accepts: boolean,
    now = new Date(),
  ) {
    await prisma.$transaction(async (tx) => {
      const election = await this.election(electionId, tx);
      this.assertBeforeDeadline(election, now);

      // Only a pending proposal can be answered; an answer is final from the person's side
      const { count } = await tx.prismaProposal.updateMany({
        where: { refElection: electionId, refPost: postId, refUser: username, status: PENDING },
        data: { status: accepts ? ACCEPTED : DECLINED, answeredAt: now },
      });
      if (count === 0) {
        throw new BadRequestError('Det finns inget obesvarat förslag att svara på');
      }
      await tx.prismaCounterCandidacy.deleteMany({
        where: { refElection: electionId, refPost: postId, refUser: username },
      });
    });
  }

  /**
   * Opens motkandidering for a post. Returns the candidates who were never proposed for it,
   * who are the ones to tell. Others who can answer find it on the site
   */
  async openCounterCandidacy(
    electionId: number,
    postId: number,
    now = new Date(),
  ): Promise<Recipients> {
    return prisma.$transaction(async (tx) => {
      const election = await this.election(electionId, tx);
      this.assertCommitteeCanAct(election, now);
      await this.assertElectable(tx, electionId, postId);

      const opened = await tx.prismaCounterCandidacyPost.findUnique({
        where: { refElection_refPost: { refElection: electionId, refPost: postId } },
      });
      if (opened) {
        throw new BadRequestError('Motkandidering är redan öppen för posten');
      }
      const proposals = await tx.prismaProposal.findMany({
        where: { refElection: electionId, refPost: postId },
      });
      if (proposals.some((p) => p.status === PENDING)) {
        throw new BadRequestError('Alla skickade förslag för posten måste vara besvarade först');
      }

      await tx.prismaCounterCandidacyPost.create({
        data: { refElection: electionId, refPost: postId, openedAt: now },
      });

      const everProposed = new Set(proposals.map((p) => p.refUser));
      const candidates = await this.candidates(tx, electionId, postId);
      return {
        usernames: candidates.filter((u) => !everProposed.has(u)),
        deadline: election.proposalDeadline as Date,
      };
    });
  }

  async respondToCounterCandidacy(
    electionId: number,
    postId: number,
    username: string,
    accepts: boolean,
    now = new Date(),
  ) {
    await prisma.$transaction(async (tx) => {
      const election = await this.election(electionId, tx);
      this.assertBeforeDeadline(election, now);

      const opened = await tx.prismaCounterCandidacyPost.findUnique({
        where: { refElection_refPost: { refElection: electionId, refPost: postId } },
      });
      if (!opened) {
        throw new BadRequestError('Motkandidering är inte öppen för posten');
      }
      await this.assertCandidate(tx, electionId, postId, username);

      const proposal = await this.findProposal(tx, electionId, postId, username);
      if (proposal?.status === PENDING || proposal?.status === ACCEPTED) {
        throw new BadRequestError('Du är föreslagen till posten och kan inte motkandidera');
      }

      await this.writeCounterCandidacy(tx, electionId, postId, username, accepts, now);
    });
  }

  private async writeCounterCandidacy(
    tx: Tx,
    electionId: number,
    postId: number,
    username: string,
    accepts: boolean,
    now: Date,
  ) {
    const answer = accepts ? PrismaNominationAnswer.YES : PrismaNominationAnswer.NO;
    await tx.prismaCounterCandidacy.upsert({
      where: {
        refElection_refPost_refUser: {
          refElection: electionId,
          refPost: postId,
          refUser: username,
        },
      },
      create: {
        refElection: electionId,
        refPost: postId,
        refUser: username,
        answer,
        answeredAt: now,
      },
      update: { answer, answeredAt: now },
    });
  }

  /** Admin change after the deadline. Accepting clears any motkandidat answer */
  async setProposalStatus(
    electionId: number,
    username: string,
    postId: number,
    status: PrismaProposalStatus,
    now = new Date(),
  ) {
    if (status !== ACCEPTED && status !== DECLINED && status !== WITHDRAWN) {
      throw new BadRequestError('Status kan bara sättas till accepterad, avböjd eller återkallad');
    }
    await prisma.$transaction(async (tx) => {
      const election = await this.election(electionId, tx);
      this.assertAfterDeadline(election, now);

      const { count } = await tx.prismaProposal.updateMany({
        where: { refElection: electionId, refPost: postId, refUser: username },
        data: { status, answeredAt: now },
      });
      if (count === 0) {
        throw new NotFoundError('Förslaget finns inte');
      }
      if (status === ACCEPTED) {
        await tx.prismaCounterCandidacy.deleteMany({
          where: { refElection: electionId, refPost: postId, refUser: username },
        });
      }
    });
  }

  /** Admin change after the deadline. `null` removes the answer */
  async setCounterCandidacy(
    electionId: number,
    username: string,
    postId: number,
    accepts: boolean | null,
    now = new Date(),
  ) {
    await prisma.$transaction(async (tx) => {
      const election = await this.election(electionId, tx);
      this.assertAfterDeadline(election, now);

      if (accepts == null) {
        await tx.prismaCounterCandidacy.deleteMany({
          where: { refElection: electionId, refPost: postId, refUser: username },
        });
        return;
      }

      await this.assertCandidate(tx, electionId, postId, username);
      const proposal = await this.findProposal(tx, electionId, postId, username);
      if (proposal?.status === ACCEPTED) {
        throw new BadRequestError('Personen har ett accepterat förslag till posten');
      }
      await this.writeCounterCandidacy(tx, electionId, postId, username, accepts, now);
    });
  }

  /** All proposals in an election as admins see them, ordered by postname */
  async getProposals(electionId: number, now = new Date()): Promise<EffectiveProposal[]> {
    const election = await this.election(electionId);
    const rows = await prisma.prismaProposal.findMany({
      where: { refElection: electionId },
      orderBy: [{ post: { postname: 'asc' } }, { refUser: 'asc' }],
    });
    return rows.map((r) => effectiveProposal(r, election, now));
  }

  /** The user's own proposals, without drafts they have not been sent */
  async getMyProposals(
    electionId: number,
    username: string,
    now = new Date(),
  ): Promise<EffectiveProposal[]> {
    const election = await this.election(electionId);
    const rows = await prisma.prismaProposal.findMany({
      where: { refElection: electionId, refUser: username, status: { not: DRAFT } },
      orderBy: { post: { postname: 'asc' } },
    });
    return rows.map((r) => effectiveProposal(r, election, now));
  }

  /**
   * Posts where motkandidering is open and the user is a candidate without a pending or
   * accepted proposal. After the deadline only posts they answered are listed, read-only
   */
  async getMyCounterCandidacies(
    electionId: number,
    username: string,
    now = new Date(),
  ): Promise<CounterCandidacyOption[]> {
    const election = await this.election(electionId);
    const past = isPastDeadline(election, now);

    const [opened, nominations, proposals, answers] = await prisma.$transaction([
      prisma.prismaCounterCandidacyPost.findMany({
        where: { refElection: electionId },
        orderBy: { post: { postname: 'asc' } },
      }),
      prisma.prismaNomination.findMany({
        where: { refElection: electionId, refUser: username, answer: PrismaNominationAnswer.YES },
      }),
      prisma.prismaProposal.findMany({ where: { refElection: electionId, refUser: username } }),
      prisma.prismaCounterCandidacy.findMany({
        where: { refElection: electionId, refUser: username },
      }),
    ]);
    const electables = new Set(await this.electablePostIds(electionId));
    const candidateFor = new Set(nominations.map((n) => n.refPost));

    return opened.flatMap(({ refPost }) => {
      if (!electables.has(refPost) || !candidateFor.has(refPost)) return [];
      const proposal = proposals.find((p) => p.refPost === refPost);
      const status = proposal && effectiveProposal(proposal, election, now).status;
      if (status === PENDING || status === ACCEPTED) return [];

      const answer = answers.find((a) => a.refPost === refPost)?.answer;
      if (past && !answer) return [];
      return [
        {
          postId: refPost,
          answer: answer ?? PrismaNominationAnswer.NOT_ANSWERED,
          canRespond: !past,
        },
      ];
    });
  }

  private async electablePostIds(electionId: number) {
    const rows = await prisma.prismaElectable.findMany({
      select: { refPost: true },
      where: { refElection: electionId },
      orderBy: { post: { postname: 'asc' } },
    });
    return rows.map((r) => r.refPost);
  }

  /** Per electable post: proposals, candidates and motkandidering, for the committee */
  async getOverview(electionId: number, now = new Date()): Promise<PostOverview[]> {
    const election = await this.election(electionId);
    const postIds = await this.electablePostIds(electionId);

    const [proposals, nominations, opened, answers] = await prisma.$transaction([
      prisma.prismaProposal.findMany({
        where: { refElection: electionId },
        orderBy: { refUser: 'asc' },
      }),
      prisma.prismaNomination.findMany({
        where: { refElection: electionId, answer: PrismaNominationAnswer.YES },
        orderBy: { refUser: 'asc' },
      }),
      prisma.prismaCounterCandidacyPost.findMany({ where: { refElection: electionId } }),
      prisma.prismaCounterCandidacy.findMany({
        where: { refElection: electionId },
        orderBy: { refUser: 'asc' },
      }),
    ]);

    const committeeCanAct =
      isClosed(election) && election.proposalDeadline != null && !isPastDeadline(election, now);

    return postIds.map((postId) => {
      const forPost = proposals
        .filter((p) => p.refPost === postId)
        .map((p) => effectiveProposal(p, election, now));
      const openedAt = opened.find((o) => o.refPost === postId)?.openedAt ?? null;
      return {
        postId,
        proposals: forPost,
        candidates: nominations.filter((n) => n.refPost === postId).map((n) => n.refUser),
        acceptedCount: forPost.filter((p) => p.status === ACCEPTED).length,
        counterCandidacyOpenedAt: openedAt,
        canOpenCounterCandidacy:
          committeeCanAct && openedAt == null && !forPost.some((p) => p.status === PENDING),
        counterCandidacies: answers.filter((a) => a.refPost === postId),
      };
    });
  }

  async clear() {
    devGuard('Cannot clear DB in production');
    await prisma.prismaCounterCandidacy.deleteMany();
    await prisma.prismaCounterCandidacyPost.deleteMany();
  }
}
