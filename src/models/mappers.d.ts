/* eslint-disable */

/**
 * Typer som definieras här måste även skrivas in i
 * `codegen.yml`!
 */

import { AccessResource, Article, File, User, Post, Meeting, Proposal } from '../graphql.generated';

export type ArticleResponse = Partial<Omit<Article, 'creator' | 'lastUpdatedBy'>> & {
  creator: Partial<User>;
  lastUpdatedBy: Partial<User>;
};

export type FileResponse = Partial<Omit<File, 'createdBy'>> & {
  createdBy: Partial<User>;
};

// prettier-ignore
export type MeetingResponse = Partial<Omit<Meeting, 'summons' | 'documents' | 'lateDocuments' | 'protocol'>
> & {
  summons?: Partial<File>;
  documents?: Partial<File>;
  lateDocuments?: Partial<File>;
  protocol?: Partial<File>;
};

export type AccessResourceResponse = Partial<AccessResource>;

// prettier-ignore
export type ElectionResponse = Partial<Omit<Election, 'creator' | 'electables' | 'proposals'>> & {
  creator: Partial<User>;
  electables: Partial<Post>[];
  proposals?: Partial<Proposal>[];
};

export type ProposalResponse = Partial<Omit<Proposal, 'user' | 'post'>> & {
  refuser: string;
  refpost: string;
};