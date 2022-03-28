import type { Article } from '@generated/graphql';

export type DatabaseArticle = Omit<Article, 'creator' | 'lastUpdatedBy' | 'slug' | 'tags'> & {
  refcreator: string;
  reflastupdateby: string;
};

export type DatabaseArticleTag = {
  id?: string;
  refarticle: string;
  tag: string;
};