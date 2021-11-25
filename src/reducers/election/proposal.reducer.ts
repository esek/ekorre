import type { DatabaseProposal } from '../../models/db/election';
import type { ProposalResponse } from '../../models/mappers';

export function proposalReduce(dbProposal: DatabaseProposal): ProposalResponse {
  const { refuser, refpost } = dbProposal;

  const pr = {
    user: {
      username: refuser
    },
    post: {
      postname: refpost
    },
  };

  return pr;
}