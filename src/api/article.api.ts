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
 * Det här är API:n för att hantera artiklar
 */
export class ArticleAPI {
  /**
   * Hämta alla artiklar sorterade på skapande och titel.
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
   * Hämtar alla nyhetsartiklar, sorterade på skapande och titel.
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
   * Hämtar alla informationsartiklar, sorterade på skapande och titel.
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
   * Hämtar alla nyhetsartiklar i ett intervall. Utelämnas
   * parametrar finns ingen begränsning. Sorteras på skapande och titel.
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
   * Hämtar de senaste nyhetsartiklarna sorterat på skapande (nyas först).
   * @param nbr antal artiklar
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
   * Lägger till en ny artikel
   * @param authorUsername Användarnamn på skaparen
   * @param entry artikel som ska läggas till
   */
  async newArticle(authorUsername: string, entry: NewArticle): Promise<PrismaExtendedArticle> {
    const { tags, ...reduced } = entry;

    const safeTags = (tags ?? []).map((t) => t.toLowerCase());

    if (entry.articleType === ArticleType.News) {
      this.checkForSpecialTags(safeTags);
    }

    const res = await prisma.prismaArticle.create({
      data: {
        body: reduced.body,
        signature: reduced.signature,
        title: reduced.title,
        articleType: reduced.articleType,
        refAuthor: authorUsername,
        refLastUpdateBy: authorUsername,
        tags: {
          create: safeTags.map((tag) => ({ tag })),
        },
      },
      include: {
        tags: true,
      },
    });

    return res;
  }

  private checkForSpecialTags(tags: string[]) {
    if (tags.some((t) => t.toLowerCase().startsWith('special:'))) {
      throw new BadRequestError('Specialtag kan inte användas för nyheter');
    }
  }

  /**
   * Modifierar en artikel; notera att vissa saker inte får
   * modifieras via API:n
   * @param id Artikelns ID
   * @param updaterUsername Användarnamn hos den som ändrat artikeln
   * @param entry Modifiering av existerande artikel
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

    const safeTags = (tags ?? []).map((t) => t.toLowerCase());

    if (entry.articleType === ArticleType.News) {
      this.checkForSpecialTags(safeTags);
    }

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

  async removeArticle(id: number): Promise<boolean> {
    const res = await prisma.prismaArticle.delete({
      where: {
        id,
      },
    });

    return res != null;
  }
}
