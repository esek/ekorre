import { Article, File, User } from '../graphql.generated';

export type ArticleResponse = Partial<Omit<Article, 'creator' | 'lastUpdatedBy'>> & {
  creator: Partial<User>;
  lastUpdatedBy: Partial<User>;
};

export type FileResponse = Partial<Omit<File, 'createdBy'>> & {
  createdBy: Partial<User>;
};
