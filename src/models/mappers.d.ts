/**
 * Typer som definieras här måste även skrivas in i
 * `codegen.yml`!
 */

import { Article, File, User, Meeting } from '../graphql.generated';

export type ArticleResponse = Partial<Omit<Article, 'creator' | 'lastUpdatedBy'>> & {
  creator: Partial<User>;
  lastUpdatedBy: Partial<User>;
};

export type FileResponse = Partial<Omit<File, 'createdBy'>> & {
  createdBy: Partial<User>;
};

export type MeetingResponse = Partial<
// Här vill ESlint ha 0 indents, men prettier 2. Jag
// håller iförsig med prettier, men fan om inte ESlint får en stroke och
// dödar CI då...
// prettier-ignore
Omit<Meeting, 'summons' | 'documents' | 'lateDocuments' | 'protocol'>
> & {
  summons?: Partial<File>;
  documents?: Partial<File>;
  lateDocuments?: Partial<File>;
  protocol?: Partial<File>;
};
