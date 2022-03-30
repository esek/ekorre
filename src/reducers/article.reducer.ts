import { ArticleResponse } from '@/models/mappers';
import { slugify } from '@/util';
import { ArticleType } from '@generated/graphql';
import { PrismaArticle } from '@prisma/client';

export const articleReducer = (article: PrismaArticle): ArticleResponse => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { body, refAuthor, refLastUpdateBy, id, articleType, ...reduced } = article;

  const a: ArticleResponse = {
    ...reduced,
    body,
    slug: slugify(id),
    author: {
      username: refAuthor,
    },
    lastUpdatedBy: {
      username: refLastUpdateBy,
    },
    articleType: articleType as ArticleType
  };

  return a;
};
