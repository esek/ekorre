import { ArticleResponse } from '@/models/mappers';
import { PrismaExtendedArticle } from '@/models/prisma';
import { slugify } from '@/util';
import { ArticleType } from '@generated/graphql';

export const articleReducer = (article: PrismaExtendedArticle): ArticleResponse => {
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
    tags,
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
    tags: tags.map((t) => t.tag),
  };

  return a;
};
