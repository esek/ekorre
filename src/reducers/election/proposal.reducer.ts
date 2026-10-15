import type { EffectiveProposal } from '@/api/proposal.api';
import type { ProposalResponse } from '@/models/mappers';
import { ProposalStatus } from '@generated/graphql';
import type { PrismaProposal } from '@prisma/client';

export function proposalReduce(dbProposal: PrismaProposal | EffectiveProposal): ProposalResponse {
  const { refUser, refPost, status, sentAt, answeredAt } = dbProposal;

  const pr = {
    user: {
      username: refUser,
    },
    post: {
      id: refPost,
    },
    status: status as ProposalStatus, // Prisma enum to graphql enum
    sentAt,
    answeredAt,
    expired: 'expired' in dbProposal ? dbProposal.expired : false,
  };

  return pr;
}
