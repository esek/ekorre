import type { ProposalResponse } from '@/models/mappers';
import type { DatabaseProposal } from '@db/election';

export function proposalReduce(dbProposal: DatabaseProposal): ProposalResponse {
  const { refuser, refpost } = dbProposal;

  const pr = {
    user: {
      username: refuser,
    },
    post: {
      postname: refpost,
    },
  };

  return pr;
}
