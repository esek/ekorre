import { Article, File, FileSystemNode, User } from '../graphql.generated';

export type ArticleResponse = Partial<Omit<Article, 'creator' | 'lastUpdatedBy'>> & {
  creator: Partial<User>;
  lastUpdatedBy: Partial<User>;
};

export type FileResponse = Partial<Omit<File, 'createdBy'>> & {
  createdBy: Partial<User>;
};

export type FileSystemNodeResponse = Partial<Omit<FileSystemNode, 'createdBy'>> & {
  createdBy: Partial<User>;
};
