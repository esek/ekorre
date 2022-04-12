import type { ProposalResponse } from '@/models/mappers';
import type { PrismaProposal } from '@prisma/client';

export function proposalReduce(dbProposal: PrismaProposal): ProposalResponse {
  const { refUser, refPost } = dbProposal;

  const pr = {
    user: {
      username: refUser,
    },
    post: {
      id: refPost,
    },
  };

  return pr;
}
