import type { Election, Nomination, Proposal } from '@generated/graphql';

export type DatabaseElection = Omit<Election, 'creator' | 'electables' | 'proposals'> & {
  refcreator: string;
};

export type DatabaseElectable = {
  refelection: string;
  refpost: string;
};

export type DatabaseNomination = Omit<Nomination, 'user' | 'post'> & {
  refelection: string;
  refuser: string;
  refpost: string;
};

export type DatabaseProposal = Omit<Proposal, 'user' | 'post'> & {
  refelection: string;
  refuser: string;
  refpost: string;
};