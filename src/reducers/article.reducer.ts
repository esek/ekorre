import { ArticleResponse } from '@/models/mappers';
import { slugify } from '@/util';
import { ArticleType } from '@generated/graphql';
import { PrismaArticle } from '@prisma/client';

export const articleReducer = (article: PrismaArticle): ArticleResponse => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    body,
    refAuthor,
    refLastUpdateBy,
    id,
    articleType,
    title,
    createdAt,
    signature,
    updatedAt,
  } = article;

  const a: ArticleResponse = {
    title,
    id,
    body,
    slug: slugify(`${title} ${id}`),
    author: {
      username: refAuthor,
    },
    lastUpdatedBy: {
      username: refLastUpdateBy,
    },
    articleType: articleType as ArticleType,
    createdAt,
    lastUpdatedAt: updatedAt,
    signature,
  };

  return a;
};
