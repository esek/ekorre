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
  // Gör så att man kan välja efter creator, datum, tags etc.

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
  async addArticle(entry: NewArticle): Promise<any> {
    return null;
  }

  /**
   * Modifierar en artikel; notera att vissa saker inte får
   * modifieras via API:n
   * @param entry Modifiering av existerande artikel
   */
  async modifyArticle(entry: ModifyArticle): Primise<any> {
    return null;
  }
}
