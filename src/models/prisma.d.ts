// Since prisma doesnt want to include som of the fields it should
import { PrismaArticle, PrismaArticleTag } from '@prisma/client';

export type PrismaExtendedArticle = PrismaArticle & {
  tags: PrismaArticleTag[];
};
