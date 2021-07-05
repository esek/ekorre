import type { Article } from '../../graphql.generated';

export type DatabaseArticle = Omit<Article, 'creator' | 'lastUpdatedBy' | 'slug'> & {
  refcreator: string;
  reflastupdateby: string;
};
