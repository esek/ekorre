import type { DatabaseProposal } from '../models/db/election';
import type { ProposalResponse } from '../models/mappers';

export function proposalReduce(dbProposal: DatabaseProposal): ProposalResponse {
  const { refelection, ...reduced } = dbProposal;
  return reduced;
}