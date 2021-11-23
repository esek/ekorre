import type { Election, Nomination, Proposal } from '../../graphql.generated';

export type DatabaseElection = Omit<Election, 'creator' | 'electables'> & {
  refcreator: string;
};

export type DatabaseNomination = Omit<Nomination, 'election' | 'user' | 'post'> & {
  refelection: string;
  refuser: string;
  refpost: string;
};

export type DatabaseProposal = Omit<Proposal, 'election' | 'user' | 'post'> & {
  refelection: string;
  refuser: string;
  refpost: string;
};
