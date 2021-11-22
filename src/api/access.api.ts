import { Logger } from '../logger';
import type { DatabaseAccess } from '../models/db/access';
import { DatabasePost } from '../models/db/post';
import { DatabaseAccessResource } from '../models/db/resource';
import {
  ACCESS_RESOURCES_TABLE,
  IND_ACCESS_TABLE,
  POSTS_TABLE,
  POST_ACCESS_TABLE,
} from './constants';
import knex from './knex';

const logger = Logger.getLogger('AccessAPI');

export type DatabaseJoinedAccess = DatabaseAccess & DatabaseAccessResource;

/**
 * Det är api:n som hanterar access.
 * Access finns i två former:
 *   - Den access som en användare ärver från en post
 *   - Den access som en specifik användare får tilldelad
 * Det är viktigt att hålla koll på denna skillnaden.
 */
export class AccessAPI {
  /**
   * Hämta specifik access för en användare
   * @param username användaren
   */
  async getIndividualAccess(username: string): Promise<DatabaseJoinedAccess[]> {
    const res = await knex<DatabaseAccess>(IND_ACCESS_TABLE)
      .where({
        refname: username,
      })
      .join<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE, 'refresource', 'id');

    return res;
  }

  /**
   * Hämta access för en post.
   * @param postname posten
   */
  async getPostAccess(postname: string): Promise<DatabaseJoinedAccess[]> {
    const res = await knex<DatabaseAccess>(POST_ACCESS_TABLE)
      .where({
        refname: postname,
      })
      .join<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE, 'refresource', 'id');

    return res;
  }

  /**
   * En private hjälpfunktion för att sätta access.
   * @param table tabellen där access raderna finns
   * @param ref referens (användare eller post)
   * @param newaccess den nya accessen
   */
  private async setAccess(table: string, ref: string, newaccess: number[]): Promise<boolean> {
    await knex<DatabaseAccess>(table)
      .where({
        refname: ref,
      })
      .delete();

    // Only do insert with actual values.
    const inserts = newaccess.map<DatabaseAccess>((id) => ({
      refname: ref,
      refresource: id,
    }));

    if (inserts.length > 0) {
      const status = await knex<DatabaseAccess>(table).insert(inserts);
      return status[0] > 0;
    }

    return false;
  }

  /**
   * Sätt access för en användare. VIKTIGT: Access är icke muterbart
   * vilket innebär att accessobjektet som matas ska innehålla allt
   * som behövs.
   * @param username användaren
   * @param newaccess den nya accessen
   */
  async setIndividualAccess(username: string, newaccess: number[]): Promise<boolean> {
    const status = this.setAccess(IND_ACCESS_TABLE, username, newaccess);

    logger.info(`Updated access for user ${username}`);
    logger.debug(`Updated access for user ${username} to ${Logger.pretty(newaccess)}`);
    return status;
  }

  /**
   * Sätt access för en post. VIKTIGT: Access är icke muterbart
   * vilket innebär att accessobjektet som matas ska innehålla allt
   * som behövs.
   * @param postname posten
   * @param newaccess den nya accessen
   */
  async setPostAccess(postname: string, newaccess: number[]): Promise<boolean> {
    const status = this.setAccess(POST_ACCESS_TABLE, postname, newaccess);

    logger.info(`Updated access for post ${postname}`);
    logger.debug(`Updated access for post ${postname} to ${Logger.pretty(newaccess)}`);
    return status;
  }

  /**
   * Hämta access för flera poster.
   * TODO: Kanske inkludera referens till post.
   * @param posts posterna
   * @param includeInactivePosts Om inaktiverade posters access ska tas med
   */
  async getAccessForPosts(
    posts: string[],
    includeInactivePosts = false,
  ): Promise<DatabaseJoinedAccess[]> {
    const query = knex<DatabaseAccess>(POST_ACCESS_TABLE)
      .whereIn('refname', posts)
      .join<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE, 'refresource', 'id');

    // Om inaktiva posters access inte ska inkluderas,
    // ta in `POSTS_TABLE` och se vilka som är aktiva
    if (!includeInactivePosts) {
      query.innerJoin<DatabasePost>(POSTS_TABLE, 'refname', 'postname').where('active', true);
    }

    const res = await query;

    return res;
  }
}
