/* eslint-disable */

/**
 * Typer som definieras här måste även skrivas in i
 * `codegen.yml`!
 *
 * Får du trots detta konstiga fel, kontrollera så att
 * 1) Du importerat alla relevanta typer (dvs. inga `any`)
 * 2) `generated/graphql.ts` ser bra ut
 */
import {
  Access,
  AccessLogPost,
  ApiKey,
  Article,
  Election,
  File,
  Hehe,
  Meeting,
  Nomination,
  Post,
  Proposal,
  User,
} from '@generated/graphql';
import { PrismaAccessResource } from '@prisma/client';

export type ArticleResponse = Partial<Omit<Article, 'author' | 'lastUpdatedBy'>> & {
  author: Partial<User>;
  lastUpdatedBy: Partial<User>;
};

export type FileResponse = Partial<Omit<File, 'createdBy'>> & {
  createdBy: Partial<User>;
};

// prettier-ignore
export type MeetingResponse = Partial<Omit<Meeting, 'summons' | 'agenda' | 'documents' | 'lateDocuments' | 'protocol' | 'appendix'>
> & {
  summons?: Partial<File>;
  agenda?: Partial<File>;
  documents?: Partial<File>;
  lateDocuments?: Partial<File>;
  protocol?: Partial<File>;
  appendix?: Partial<File>;
};

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

export type HeheResponse = Omit<Hehe, 'uploader' | 'file'> & {
  uploader: Partial<User>;
  file: Partial<File>;
};

export type AccessLogResponse = Omit<AccessLogPost, 'grantor' | 'target'> & {
  grantor: Partial<User>;
  target: Partial<Post>;
};

export type ApiKeyResponse = Omit<ApiKey, 'creator' | 'refcreator'> & {
  creator: Partial<User>;
};
