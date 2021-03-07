/* eslint-disable class-methods-use-this */

import { sign } from 'jsonwebtoken';
import type { Article, ArticleType, NewArticle, ModifyArticle } from '../graphql.generated';
import { Logger } from '../logger';
import { ARTICLE_TABLE } from './constants';
import knex from './knex';

const logger = Logger.getLogger('ArticleAPI');

// Refs används när en annan databas innehåller informationen,
// så denna innehåller bara en referens för att kunna hitta
// rätt i den
export type ArticleModel = Omit<Article, 'creator' | 'lastUpdatedBy'> & {
  refcreator: string;  // Reference for use, i.e. username
  reflastupdateby: string;
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
    const allNewsArticles = await knex<ArticleModel>(ARTICLE_TABLE).where('articletype', 'news').orderBy('createdat', 'desc');

    return allNewsArticles;
  }

  async getAllInformationArticles(): Promise<ArticleModel[]> {
    const allInformationArticles = await knex<ArticleModel>(ARTICLE_TABLE).where('articletype', 'information');

    return allInformationArticles;
  }

  /**
   * Hämtar alla nyhetsartiklar i ett intervall. Utelämnas
   * parametrar finns ingen begränsning.
   * @param creator 
   * @param after 
   * @param before 
   */
  async getNewsArticlesFromInterval(creator: string, after: DateTime, before: DateTime): Promise<ArticleModel[] | null> {

    const newsArticleModels = await knex<ArticleModel>(ARTICLE_TABLE)
  }

  /**
   * Returns the article with the specified id
   * @param id article id
   */
  async getArticle(id: string): Promise<ArticleModel | null> {
    const article = await knex<ArticleModel>(ARTICLE_TABLE).where('id', id).first();

    return article ?? null;
  }

  /**
   * Returns a list of AticleModels from database WHERE params match.
   * @param params possible params are ArticleModel parts.
   */
  async getArticles(params: Partial<ArticleModel>): Promise<ArticleModel[] | null> {

    // Ta bort undefined, de ogillas SKARPT  av Knex.js
    Object.keys(params).forEach(key => params[key] === undefined ? delete params[key] : {});

    const article = await knex<ArticleModel>(ARTICLE_TABLE).where(params);

    return article ?? null;
  }

  /**
   * Hämtar de senaste nyhetsartiklarna
   * @param nbr antal artiklar
   */
  async getLatestNews(limit: number): Promise<ArticleModel[] | null> {
    const lastestNews = await knex<ArticleModel>(ARTICLE_TABLE).where('articleType', 'news').orderBy('createdat', 'desc').limit(limit);
    
    return lastestNews;
  }

  /**
   * Lägger till en ny artikel
   * @param entry artikel som ska läggas till
   */
  async newArticle(entry: NewArticle): Promise<any> {
    return null;
  }

  /**
   * Modifierar en artikel; notera att vissa saker inte får
   * modifieras via API:n
   * @param entry Modifiering av existerande artikel
   */
  async modifyArticle(entry: ModifyArticle): Promise<any> {
    return null;
  }
}
