/* eslint-disable class-methods-use-this */
import { BadRequestError, NotFoundError } from '@/errors/request.errors';
import { StrictObject } from '@/models/base';
<<<<<<< HEAD
import { slugify, stripObject, toUTC } from '@/util';
import { ModifyArticle, NewArticle } from '@generated/graphql';
import { Prisma, PrismaArticle, PrismaArticleType } from '@prisma/client';

import prisma from './prisma';
=======
import { stripObject, toUTC } from '@/util';
import type { DatabaseArticle, DatabaseArticleTag } from '@db/article';
import { ArticleType, ModifyArticle, NewArticle } from '@generated/graphql';
import { convertMarkdownToHtml } from '@reducer/article';
import { Maybe } from 'graphql/jsutils/Maybe';

import { ARTICLE_TABLE, ARTICLE_TAGS_TABLE } from './constants';
import db from './knex';

// Refs används när en annan databas innehåller informationen,
// så denna innehåller bara en referens för att kunna hitta
// rätt i den

type GetArticleParams = {
  id: Maybe<string>;
  slug: Maybe<string>;
};
>>>>>>> 6259fc36b23d2a6f070633cbbe48f4d57967e7a2

/**
 * Det här är API:n för att hantera artiklar
 */
export class ArticleAPI {
  /**
   * Hämta alla artiklar
   */
  async getAllArticles(): Promise<PrismaArticle[]> {
    const a = await prisma.prismaArticle.findMany();

    return a;
  }

  /**
   * Hämtar alla nyhetsartiklar, sorterade på skapande
   */
  async getAllNewsArticles(): Promise<PrismaArticle[]> {
    const a = await prisma.prismaArticle.findMany({
      where: {
        articleType: PrismaArticleType.NEWS,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return a;
  }

  async getAllInformationArticles(): Promise<PrismaArticle[]> {
    const a = await prisma.prismaArticle.findMany({
      where: {
        articleType: PrismaArticleType.INFORMATION,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return a;
  }

  /**
   * Hämtar alla nyhetsartiklar i ett intervall. Utelämnas
   * parametrar finns ingen begränsning.
   * @param after
   * @param before
   * @param author Username of original author of the article
   */
  async getNewsArticlesFromInterval(
    after: Date,
    before: Date,
    author?: string,
  ): Promise<PrismaArticle[]> {
    const a = await prisma.prismaArticle.findMany({
      where: {
        articleType: PrismaArticleType.NEWS,
        createdAt: {
          lte: after,
          gte: before,
        },
        refAuthor: author,
      },
    });

    return a;
  }

  /**
   * Returns the article with the specified id
   * @param id article id
   */
  async getArticle(id?: number, slug?: string): Promise<PrismaArticle> {
    let dbId = id;

    if (slug) {
      // Fetches the last number from a string, ex: `article-with-long-123-slug-7`, gives `7`
      // (last part of slug is ID)
      const regex = RegExp(/(\d+)[^-]*$/).exec(slug);

      if (regex?.length) {
        const [match] = regex;
        dbId = Number.parseInt(match, 10);
      }
    }

    if (dbId == null) {
      throw new BadRequestError('Inte en valid slug');
    }

    const a = await prisma.prismaArticle.findFirst({
      where: {
        id: dbId,
      },
    });

    if (a == null) {
      throw new NotFoundError('Artikeln kunde inte hittas');
    }

    return a;
  }

  /**
   * Returns a list of PrismaArticles from database WHERE params match.
   * @param params possible params are ArticleModel parts.
   */
<<<<<<< HEAD
  async getArticles(params: Prisma.PrismaArticleWhereInput): Promise<PrismaArticle[]> {
    const a = await prisma.prismaArticle.findMany({
      where: {
        ...params,
      },
    });

    return a;
=======
  async getArticles(params: Partial<DatabaseArticle & { tags: string[] }>): Promise<DatabaseArticle[]> {
    const safeParams = stripObject(params);
    const { tags, ...rest } = safeParams;

    const query = db<DatabaseArticle>(ARTICLE_TABLE).where(rest);

    if (tags?.length) {
      const ids = await db<DatabaseArticleTag>(ARTICLE_TAGS_TABLE).whereIn('tag', tags);
      query.whereIn('id', ids.map((t) => t.refarticle));
    }

    const response = await query;

    return response;
>>>>>>> 6259fc36b23d2a6f070633cbbe48f4d57967e7a2
  }

  /**
   * Hämtar de senaste nyhetsartiklarna
   * @param nbr antal artiklar
   */
  async getLatestNews(limit: number): Promise<PrismaArticle[]> {
    const lastestNews = await prisma.prismaArticle.findMany({
      where: {
        articleType: PrismaArticleType.NEWS,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return lastestNews;
  }

  /**
   * Lägger till en ny artikel
   * @param authorUsername Användarnamn på skaparen
   * @param entry artikel som ska läggas till
   */
<<<<<<< HEAD
  async newArticle(authorUsername: string, entry: NewArticle): Promise<PrismaArticle> {
    // todo: update so tags are set as well
    const { tags, ...reduced } = entry;

    const res = await prisma.prismaArticle.create({
      data: {
        body: reduced.body,
        signature: reduced.signature,
        title: reduced.title,
        articleType: reduced.articleType,
        slug: slugify(reduced.title),
        refAuthor: authorUsername,
        refLastUpdateBy: authorUsername,
      },
    });

    return res;
=======
  async newArticle(creatorUsername: string, entry: NewArticle): Promise<DatabaseArticle> {

    const { tags, ...rest } = entry;

    // Lägger till dagens datum som createdAt och lastUpdatedAt
    // samt sätter creator som lastUpdateBy
    const article: DatabaseArticle = {
      ...rest,
      createdAt: toUTC(new Date()),
      lastUpdatedAt: toUTC(new Date()),
      refcreator: creatorUsername,
      reflastupdateby: creatorUsername,
    };

    const [id]: string | undefined [] = await db<DatabaseArticle>(ARTICLE_TABLE).insert(article).returning('id');

    if (id == null) {
      throw new Error('Kunde inte lägga till artikel');
    }

    await this.addTags(id, tags);

    return {
      ...article,
      id: id ?? -1,
    };
>>>>>>> 6259fc36b23d2a6f070633cbbe48f4d57967e7a2
  }

  /**
   * Modifierar en artikel; notera att vissa saker inte får
   * modifieras via API:n
   * @param id Artikelns ID
   * @param updaterUsername Användarnamn hos den som ändrat artikeln
   * @param entry Modifiering av existerande artikel
   */
  async modifyArticle(id: number, updaterUsername: string, entry: ModifyArticle): Promise<boolean> {
    if (updaterUsername === '' || updaterUsername == null) {
      throw new BadRequestError('Artiklar måste modifieras av inloggade användare');
    }

    const { tags, ...rest } = entry;

    const update: StrictObject = stripObject(rest);

    update.reflastupdateby = updaterUsername;

    update.lastUpdatedAt = toUTC(new Date());

    const res = await prisma.prismaArticle.update({
      data: {
        ...update,
      },
      where: {
        id,
      },
    });

<<<<<<<HEAD
    // const res = await db<PrismaArticle>(ARTICLE_TABLE).where('id', id).update(update);

    return res != null;
=======
    if (tags?.length) {
      await this.removeTags(id);
      await this.addTags(id, tags);
    }

    return res > 0;
>>>>>>> 6259fc36b23d2a6f070633cbbe48f4d57967e7a2
  }

  async removeArticle(id: number): Promise<boolean> {
    const res = await prisma.prismaArticle.delete({
      where: {
        id,
      },
    });

    return res != null;
  }

  async getTagsForArticle(id: string): Promise<DatabaseArticleTag[]> {
    const tags = await this.getTagsForArticles([id]);

    return tags?.length !== 0 && tags[0]?.length > 0 ? tags[0] : [];
  }

  async getTagsForArticles(ids: string[]): Promise<DatabaseArticleTag[][]> {
    const tags = await db<DatabaseArticleTag>(ARTICLE_TAGS_TABLE).whereIn('refarticle', ids);

    // Går att optimera
    const mapped = ids.map((id) => {
      return tags.filter((tag) => tag.refarticle === id);
    });

    return mapped;
  }

  async addTags(articleId: string, tags: string[]): Promise<boolean> {
    const tagentries: DatabaseArticleTag[] = tags.map((tag) => ({ tag, refarticle: articleId }));

    // Should error here if anything goes wrong
    await db<DatabaseArticleTag>(ARTICLE_TAGS_TABLE).insert(tagentries);

    return true;
  }

  async removeTags(articleId: string): Promise<boolean> {
    await db<DatabaseArticleTag>(ARTICLE_TAGS_TABLE).where('refarticle', articleId).delete();
    return true;
  }
}
