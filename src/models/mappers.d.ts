/* eslint-disable */

/**
 * Typer som definieras här måste även skrivas in i
 * `codegen.yml`!
 *
 * Får du trots detta konstiga fel, kontrollera så att
 * 1) Du importerat alla relevanta typer (dvs. inga `any`)
 * 2) `graphql.generated.ts` ser bra ut
 */
import {
  AccessResource,
  Article,
  File,
  User,
  Post,
  Meeting,
  Election,
  Nomination,
  Proposal,
} from '../graphql.generated';

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
export type ElectionResponse = Partial<Omit<Election, 'creator' | 'electables' | 'proposals' | 'acceptedNominations'>> & {
  creator: Partial<User>;
};

export type ProposalResponse = Partial<Omit<Proposal, 'user' | 'post'>> & {
  user: Partial<User>;
  post: Partial<Post>;
};

export type NominationResponse = Partial<Omit<Nomination, 'user' | 'post'>> & {
  user: Partial<User>;
  post: Partial<Post>;
};
