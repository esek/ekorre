/* eslint-disable class-methods-use-this */
import { BadRequestError, NotFoundError } from '@/errors/request.errors';
import { StrictObject } from '@/models/base';
import { PrismaExtendedArticle } from '@/models/prisma';
import { parseSlug, stripObject, toUTC } from '@/util';
import { ArticleType, ModifyArticle, NewArticle } from '@generated/graphql';
import { Prisma, PrismaArticleType } from '@prisma/client';

import prisma from './prisma';

const defaultOrder: Prisma.PrismaArticleOrderByWithRelationAndSearchRelevanceInput[] = [
  {
    createdAt: 'desc',
  },
  {
    title: 'asc',
  },
];

/**
 * This is the API to handle articles
 */
export class ArticleAPI {
  /**
   * Retreives all articles sorted by creation date first and then title
   */
  async getAllArticles(): Promise<PrismaExtendedArticle[]> {
    const a = await prisma.prismaArticle.findMany({
      include: {
        tags: true,
      },
      orderBy: defaultOrder,
    });

    return a;
  }

  /**
   * Retreives all news articles sorted by creation date first and then title
   */
  async getAllNewsArticles(): Promise<PrismaExtendedArticle[]> {
    const a = await prisma.prismaArticle.findMany({
      where: {
        articleType: PrismaArticleType.NEWS,
      },
      orderBy: defaultOrder,
      include: {
        tags: true,
      },
    });

    return a;
  }

  /**
   * Retreives all information articles sorted by creation date first and then title
   */
  async getAllInformationArticles(): Promise<PrismaExtendedArticle[]> {
    const a = await prisma.prismaArticle.findMany({
      where: {
        articleType: PrismaArticleType.INFORMATION,
      },
      orderBy: defaultOrder,
      include: {
        tags: true,
      },
    });

    return a;
  }

  /**
   * Retrieves all news articles in an interval. If parameters are left
   * out, no limit in that direction is used. Sorted by creation first and then title
   * @param after
   * @param before
   * @param author Username of original author of the article
   */
  async getNewsArticlesFromInterval(
    after: Date,
    before: Date,
    author?: string,
  ): Promise<PrismaExtendedArticle[]> {
    const a = await prisma.prismaArticle.findMany({
      where: {
        articleType: PrismaArticleType.NEWS,
        createdAt: {
          lte: after,
          gte: before,
        },
        refAuthor: author,
      },
      include: {
        tags: true,
      },
      orderBy: defaultOrder,
    });

    return a;
  }

  /**
   * Returns the article with the specified id
   * @param id article id
   */
  async getArticle(id?: number, slug?: string): Promise<PrismaExtendedArticle> {
    let dbId = id;

    if (slug) {
      dbId = parseSlug(slug);
    }

    if (dbId == null) {
      throw new BadRequestError('Inte en valid slug');
    }

    const a = await prisma.prismaArticle.findFirst({
      where: {
        id: dbId,
      },
      include: {
        tags: true,
      },
    });

    if (a == null) {
      throw new NotFoundError('Artikeln kunde inte hittas');
    }

    return a;
  }

  /**
   * Returns a list of PrismaArticles from database WHERE params match.
   * @param author Username of user that created the article
   * @param id ID of the article
   * @param type Type of the article, e.g. news
   * @param tags Tags attached to the article
   */
  async getArticles(
    author?: string | null,
    id?: number | null,
    type?: ArticleType | null,
    tags?: string[] | null,
  ): Promise<PrismaExtendedArticle[]> {
    const whereAnd: Prisma.PrismaArticleWhereInput[] = [];

    if (author != null) {
      whereAnd.push({ refAuthor: author });
    }

    if (id != null) {
      whereAnd.push({ id });
    }

    if (type != null) {
      whereAnd.push({ articleType: type });
    }

    if (tags != null && tags.length > 0) {
      whereAnd.push({
        tags: { some: { tag: { in: tags } } },
      });
    }

    const a = await prisma.prismaArticle.findMany({
      where: {
        AND: whereAnd,
      },
      include: {
        tags: true,
      },
      orderBy: defaultOrder,
    });

    return a;
  }

  /**
   * Retrieves the last news articles, sorted by creation (newest first)
   * @param nbr The number of articles to be retrieved
   */
  async getLatestNews(limit: number): Promise<PrismaExtendedArticle[]> {
    const lastestNews = await prisma.prismaArticle.findMany({
      where: {
        articleType: PrismaArticleType.NEWS,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        tags: true,
      },
    });

    return lastestNews;
  }

  /**
   * Creates a new article
   * @param authorUsername Username of the article creator
   * @param entry The article to be added
   */
  async newArticle(authorUsername: string, entry: NewArticle): Promise<PrismaExtendedArticle> {
    // todo: update so tags are set as well
    const { tags, ...reduced } = entry;

    const res = await prisma.prismaArticle.create({
      data: {
        body: reduced.body,
        signature: reduced.signature,
        title: reduced.title,
        articleType: reduced.articleType,
        refAuthor: authorUsername,
        refLastUpdateBy: authorUsername,
        tags: {
          create: tags.map((tag) => ({ tag })),
        },
      },
      include: {
        tags: true,
      },
    });

    return res;
  }

  /**
   * Modifies an article
   * 
   * *Note:* Some parts of the article is not possible to be edited
   * @param id ID of the article
   * @param updaterUsername Username of the person who updated the article
   * @param entry Modification of existing article
   */
  async modifyArticle(
    id: number,
    updaterUsername: string,
    entry: ModifyArticle,
  ): Promise<PrismaExtendedArticle> {
    if (updaterUsername === '' || updaterUsername == null) {
      throw new BadRequestError('Artiklar måste modifieras av inloggade användare');
    }

    const { tags, ...rest } = entry;

    const update: StrictObject = stripObject(rest);

    update.refLastUpdateBy = updaterUsername;

    update.updatedAt = toUTC(new Date());

    const safeTags = tags ?? [];

    const res = await prisma.prismaArticle.update({
      data: {
        ...update,
        tags: {
          deleteMany: {},
          create: safeTags.map((tag) => ({ tag })),
        },
      },
      where: {
        id,
      },
      include: {
        tags: true,
      },
    });

    return res;
  }

  /**
   * Removes an article
   * @param id ID of the article to be removed
   * @returns If the article was removed successfully
   */
  async removeArticle(id: number): Promise<boolean> {
    const res = await prisma.prismaArticle.delete({
      where: {
        id,
      },
    });

    return res != null;
  }
}
