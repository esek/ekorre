import { sign } from 'jsonwebtoken';
import type { Article, ArticleType, NewArticle, ModifyArticle } from '../graphql.generated';
import { Logger } from '../logger';
import { ARTICLE_TABLE } from './constants';
import knex from './knex';

const logger = Logger.getLogger('AccessAPI');

export type ArticleModel = Omit<Article, 'creator'> & {
  refuser: string;
}

/**
 * Det här är API:n för att hantera artiklar
 */
// TODO: Fixa vad som ska kräva auth och inte
export class articleAPI {
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
    const allNewsArticles = await knex<ArticleModel>(ARTICLE_TABLE).where('articleType', 'news');

    return allNewsArticles;
  }

  async getAllInformationArticles(): Promise<ArticleModel[]> {
    const allInformationArticles = await knex<ArticleModel>(ARTICLE_TABLE).where('articleType', 'information');

    return allInformationArticles;
  }

  /**
   * Hämta en specifik artikel efter ID
   * @param id artikel-id:n
   */
  async getArticles(id?: string, creator?: string, title?: string, createdAt?: Date | string, 
                  lastUpdatedAt?: Date | string, signature?: string, tags?: string[]): Promise<ArticleModel[] | null> {
    // All parameters not passed is replaced by wildcard character '%'
    id = id || '%';
    creator = creator || '%';
    title = title || '%';
    createdAt = createdAt || '%';
    lastUpdatedAt = lastUpdatedAt || '%';
    signature = signature || '%';
    tags = tags || ['%'];
    const article = await knex<ArticleModel>(ARTICLE_TABLE).where({
      id: id,
      refuser: creator,
      title: title,
      createdAt: createdAt,
      lastUpdatedAt: lastUpdatedAt,
      signature: signature,
      tags: tags
    });

    return article ?? null;
  }

  /**
   * Hämtar de senaste nyhetsartiklarna
   * @param nbr antal artiklar
   */
  async getLatestNews(limit: number): Promise<ArticleModel[]> {
    const lastestNews = await knex<ArticleModel>(ARTICLE_TABLE).where('articleType', 'news').orderBy('createdat', 'desc').limit(limit);
    
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
