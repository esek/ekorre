/* eslint-disable class-methods-use-this */
import { BadRequestError, NotFoundError } from '@/errors/request.errors';
import { StrictObject } from '@/models/base';
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

/**
 * Det här är API:n för att hantera artiklar
 */
// TODO: Fixa vad som ska kräva auth och inte
export class ArticleAPI {
  /**
   * Hämta alla artiklar
   */
  async getAllArticles(): Promise<DatabaseArticle[]> {
    const allArticles = await db<DatabaseArticle>(ARTICLE_TABLE);

    return allArticles;
  }

  /**
   * Hämtar alla nyhetsartiklar
   */
  async getAllNewsArticles(): Promise<DatabaseArticle[]> {
    const allNewsArticles = await db<DatabaseArticle>(ARTICLE_TABLE)
      .where('articletype', 'news')
      .orderBy('createdat', 'desc');

    return allNewsArticles;
  }

  async getAllInformationArticles(): Promise<DatabaseArticle[]> {
    const allInformationArticles = await db<DatabaseArticle>(ARTICLE_TABLE).where(
      'articletype',
      'information',
    );

    return allInformationArticles;
  }

  /**
   * Hämtar alla nyhetsartiklar i ett intervall. Utelämnas
   * parametrar finns ingen begränsning.
   * @param creator
   * @param after
   * @param before
   */
  async getNewsArticlesFromInterval(
    after: Date,
    before: Date,
    creator?: string,
  ): Promise<DatabaseArticle[]> {
    const search: Record<string, string> = {
      articleType: ArticleType.News,
    };

    if (creator) {
      search.refcreator = creator;
    }

    const newsArticleModels = await db<DatabaseArticle>(ARTICLE_TABLE)
      .where(search)
      .andWhere('createdAt', '<', before)
      .andWhere('createdAt', '>', after);

    return newsArticleModels?.length ? newsArticleModels : [];
  }

  /**
   * Returns the article with the specified id
   * @param id article id
   */
  async getArticle({ id, slug }: GetArticleParams): Promise<DatabaseArticle> {
    let dbId = id;

    if (slug) {
      // Fetches the last number from a string, ex: `article-with-long-123-slug-7`, gives `7`
      const regex = RegExp(/(\d+)[^-]*$/).exec(slug);

      if (regex?.length) {
        const [match] = regex;
        dbId = match;
      }
    }

    if (dbId == null) {
      throw new BadRequestError('Inte en valid slug');
    }

    const article = await db<DatabaseArticle>(ARTICLE_TABLE).where('id', dbId).first();

    if (article == null) {
      throw new NotFoundError('Artikeln kunde inte hittas');
    }

    return article;
  }

  /**
   * Returns a list of AticleModels from database WHERE params match.
   * @param params possible params are ArticleModel parts.
   */
  async getArticles(params: Partial<DatabaseArticle>): Promise<DatabaseArticle[]> {
    const safeParams = stripObject(params);
    const { tags, ...rest } = safeParams;

    const query = db<DatabaseArticle>(ARTICLE_TABLE).where(rest);

    if (tags?.length) {
      const ids = await db<DatabaseArticleTag>(ARTICLE_TAGS_TABLE).whereIn('tag', tags);
      query.whereIn('id', ids.map((t) => t.refarticle));
    }

    const response = await query;

    return response;
  }

  /**
   * Hämtar de senaste nyhetsartiklarna
   * @param nbr antal artiklar
   */
  async getLatestNews(limit: number): Promise<DatabaseArticle[]> {
    const lastestNews = await db<DatabaseArticle>(ARTICLE_TABLE)
      .where('articleType', 'news')
      .orderBy('createdat', 'desc')
      .limit(limit);

    return lastestNews;
  }

  /**
   * Lägger till en ny artikel
   * @param creatorUsername Användarnamn på skaparen
   * @param entry artikel som ska läggas till
   */
  async newArticle(creatorUsername: string, entry: NewArticle): Promise<DatabaseArticle> {
    // Lägger till dagens datum som createdAt och lastUpdatedAt
    // samt sätter creator som lastUpdateBy
    const article: DatabaseArticle = {
      ...entry,
      createdAt: toUTC(new Date()),
      lastUpdatedAt: toUTC(new Date()),
      tags: entry.tags ?? [],
      refcreator: creatorUsername,
      reflastupdateby: creatorUsername,
    };

    const res = await db<DatabaseArticle>(ARTICLE_TABLE).insert(article);

    return {
      ...article,
      id: res[0].toString() ?? -1,
    };
  }

  /**
   * Modifierar en artikel; notera att vissa saker inte får
   * modifieras via API:n
   * @param id Artikelns ID
   * @param updaterUsername Användarnamn hos den som ändrat artikeln
   * @param entry Modifiering av existerande artikel
   */
  async modifyArticle(id: string, updaterUsername: string, entry: ModifyArticle): Promise<boolean> {
    if (updaterUsername === '' || updaterUsername == null) {
      throw new BadRequestError('Artiklar måste modifieras av inloggade användare');
    }

    const update: StrictObject = stripObject(entry);

    // We only want to update the body if it is passed
    if (update.body != null) {
      update.body = convertMarkdownToHtml(update.body ?? '');
    }

    update.reflastupdateby = updaterUsername;

    update.lastUpdatedAt = toUTC(new Date());

    const res = await db<DatabaseArticle>(ARTICLE_TABLE).where('id', id).update(update);

    return res > 0;
  }

  async removeArticle(id: string): Promise<boolean> {
    const res = await db<DatabaseArticle>(ARTICLE_TABLE).delete().where('id', id);
    return res > 0;
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
}
