/* eslint-disable class-methods-use-this */

import { Maybe } from 'graphql/jsutils/Maybe';

import { Article, ArticleType, ModifyArticle, NewArticle } from '../graphql.generated';
import { stripObject, toUTC } from '../util';
import { ARTICLE_TABLE } from './constants';
import knex from './knex';

// Refs används när en annan databas innehåller informationen,
// så denna innehåller bara en referens för att kunna hitta
// rätt i den
export type ArticleModel = Omit<Article, 'creator' | 'lastUpdatedBy' | 'slug'> & {
  refcreator: string; // Reference for use, i.e. username
  reflastupdateby: string;
};

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
  async getAllArticles(): Promise<ArticleModel[]> {
    const allArticles = await knex<ArticleModel>(ARTICLE_TABLE);

    return allArticles;
  }

  /**
   * Hämtar alla nyhetsartiklar
   */
  async getAllNewsArticles(): Promise<ArticleModel[]> {
    const allNewsArticles = await knex<ArticleModel>(ARTICLE_TABLE)
      .where('articletype', 'news')
      .orderBy('createdat', 'desc');

    return allNewsArticles;
  }

  async getAllInformationArticles(): Promise<ArticleModel[]> {
    const allInformationArticles = await knex<ArticleModel>(ARTICLE_TABLE).where(
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
  ): Promise<ArticleModel[]> {
    const search: Record<string, string> = {
      articleType: ArticleType.News,
    };

    if (creator) {
      search.refcreator = creator;
    }

    const newsArticleModels = await knex<ArticleModel>(ARTICLE_TABLE)
      .where(search)
      .andWhere('createdAt', '<', before)
      .andWhere('createdAt', '>', after);

    return newsArticleModels?.length ? newsArticleModels : [];
  }

  /**
   * Returns the article with the specified id
   * @param id article id
   */
  async getArticle({ id, slug }: GetArticleParams): Promise<ArticleModel | null> {
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
      return null;
    }

    const article = await knex<ArticleModel>(ARTICLE_TABLE).where('id', dbId).first();

    return article ?? null;
  }

  /**
   * Returns a list of AticleModels from database WHERE params match.
   * @param params possible params are ArticleModel parts.
   */
  async getArticles(params: Partial<ArticleModel>): Promise<ArticleModel[] | null> {
    // Ta bort undefined, de ogillas SKARPT  av Knex.js

    // Ts låter en inte indexera nycklar i params med foreach
    const copy: Record<string, unknown> = { ...params };
    Object.keys(copy).forEach((key) => (copy[key] === undefined ? delete copy[key] : {}));

    const article = await knex<ArticleModel>(ARTICLE_TABLE).where(copy);

    return article ?? null;
  }

  /**
   * Hämtar de senaste nyhetsartiklarna
   * @param nbr antal artiklar
   */
  async getLatestNews(limit: number): Promise<ArticleModel[] | null> {
    const lastestNews = await knex<ArticleModel>(ARTICLE_TABLE)
      .where('articleType', 'news')
      .orderBy('createdat', 'desc')
      .limit(limit);

    return lastestNews;
  }

  /**
   * Lägger till en ny artikel
   * @param entry artikel som ska läggas till
   */
  async newArticle(entry: NewArticle): Promise<ArticleModel> {
    // Lägger till dagens datum som createdAt och lastUpdatedAt
    // samt sätter creator som lastUpdateBy

    const { creator, ...reduced } = entry;

    const article: ArticleModel = {
      ...reduced,
      createdAt: toUTC(new Date()),
      lastUpdatedAt: toUTC(new Date()),
      tags: entry.tags ?? [],
      refcreator: creator,
      reflastupdateby: creator,
    };

    const res = await knex<ArticleModel>(ARTICLE_TABLE).insert(article);

    return {
      ...article,
      id: res[0].toString() ?? -1,
    };
  }

  /**
   * Modifierar en artikel; notera att vissa saker inte får
   * modifieras via API:n
   * @param entry Modifiering av existerande artikel
   */
  async modifyArticle(id: number, entry: ModifyArticle): Promise<boolean> {
    const update: Record<string, unknown> = stripObject(entry);

    // TODO: Add lastUpdatedBy using auth

    update.lastUpdatedAt = toUTC(new Date());

    const res = await knex<ArticleModel>(ARTICLE_TABLE).where('id', id).update(update);

    return res > 0;
  }
}
