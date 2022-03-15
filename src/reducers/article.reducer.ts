import { ArticleResponse } from '@/models/mappers';
import { ArticleType } from '@generated/graphql';
import { PrismaArticle } from '@prisma/client';

export const articleReducer = (article: PrismaArticle): ArticleResponse => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { body, refAuthor, refLastUpdateBy, articleType, ...reduced } = article;

  const a: ArticleResponse = {
    ...reduced,
    articleType: articleType as ArticleType,
    // Exteremely temporary fix for tags, as SQL can't store arrays
    tags: [], // TODO fix tags
    author: {
      username: refAuthor,
    },
    lastUpdatedBy: {
      username: refLastUpdateBy,
    },
  };

  return a;
};
