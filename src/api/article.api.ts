import type { Article, ArticleType, NewArticle, ModifyArticle } from '../graphql.generated';
import { Logger } from '../logger';
import { IND_ACCESS_TABLE, POST_ACCESS_TABLE } from './constants';
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
  async getArticles(): Promise<any> {
    return null;
  }

  /**
   * Hämta en specifik artikel efter ID
   * @param id artikel-id:n
   */
  async getArticle(id: ID): Promise<any> {
    return null;
  }
  // Gör så att man kan välja efter creator, datum, etc.

  /**
   * Hämtar de senaste nyhetsartiklarna
   * @param nbr antal artiklar
   */
  async getLatestNews(nbr: Number): Promise<any> {
    return null;
  }

  /**
   * Lägger till en ny artikel
   * @param entry artikel som ska läggas till
   */
  async addArticle(entry: Article): Promise<any> {
    return null;
  }
}