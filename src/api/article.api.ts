import type { Article, ArticleType, NewArticle, ModifyArticle } from '../graphql.generated';
import { Logger } from '../logger';
import { ARTICLE_TABLE } from './constants';
import knex from './knex';

const logger = Logger.getLogger('AccessAPI');

/**
 * Det här är API:n för att hantera artiklar
 */
// TODO: Fixa vad som ska kräva auth och inte
export class articleAPI {
  /**
   * Hämta alla artiklar
   */
  async getAllArticles(): Promise<Article[]> {
    const allArticles = await knex<Article>(ARTICLE_TABLE);

    return allArticles;
  }

  /** 
   * Hämtar alla nyhetsartiklar
  */
  async getAllNewsArticles(): Promise<Article[]> {
    const allNewsArticles = await knex<Article>(ARTICLE_TABLE).where('articleType', 'news');

    return allNewsArticles;
  }

  async getAllInformationArticles(): Promise<Article[]> {
    const allInformationArticles = await knex<Article>(ARTICLE_TABLE).where('articleType', 'information');

    return allInformationArticles;
  }

  /**
   * Hämta en specifik artikel efter ID
   * @param id artikel-id:n
   */
  async getArticle(id: string): Promise<Article | null> {
    const article = await knex<Article>(ARTICLE_TABLE).where('id', id).first();

    return article ?? null;
  }
  // TODO: Gör så att man kan välja efter creator, datum, tags etc.

  /**
   * Hämtar de senaste nyhetsartiklarna
   * @param nbr antal artiklar
   */
  async getLatestNews(limit: number): Promise<Article[]> {
    const lastestNews = await knex<Article>(ARTICLE_TABLE).where('articleType', 'news').orderBy('createdat', 'desc').limit(limit);
    
    return lastestNews;
  }

  /**
   * Lägger till en ny artikel
   * @param entry artikel som ska läggas till
   */
  async addArticle(entry: NewArticle): Promise<any> {
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
