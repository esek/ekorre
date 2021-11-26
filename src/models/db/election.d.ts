import type { Election, Nomination, Proposal } from '../../graphql.generated';

export type DatabaseElection = Omit<Election, 'creator' | 'electables' | 'proposals'> & {
  refcreator: string;
};

export type DatabaseNomination = Omit<Nomination, 'user' | 'post'> & {
  refuser: string;
  refpost: string;
};

export type DatabaseProposal = Omit<Proposal, 'user' | 'post'> & {
  refelection: string;
  refuser: string;
  refpost: string;
};
