import { Logger } from '../logger';
import type { DatabaseAccess } from '../models/db/access';
import { DatabaseResource } from '../models/db/resource';
import { IND_ACCESS_TABLE, POST_ACCESS_TABLE, RESOURCES_TABLE } from './constants';
import knex from './knex';

const logger = Logger.getLogger('AccessAPI');

export type DatabaseJoinedAccess = DatabaseAccess & DatabaseResource;

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
        ref: username,
      })
      .join<DatabaseResource>(RESOURCES_TABLE, 'refResource', 'id');

    return res;
  }

  /**
   * Hämta access för en post.
   * @param postname posten
   */
  async getPostAccess(postname: string): Promise<DatabaseJoinedAccess[]> {
    const res = await knex<DatabaseAccess>(POST_ACCESS_TABLE)
      .where({
        ref: postname,
      })
      .join<DatabaseResource>(RESOURCES_TABLE, 'refResource', 'id');

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
        ref,
      })
      .delete();

    // Only do insert with actual values.
    const inserts = newaccess.map<DatabaseAccess>((id) => ({
      ref,
      refResource: id,
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
   */
  async getAccessForPosts(posts: string[]): Promise<DatabaseJoinedAccess[]> {
    const res = await knex<DatabaseAccess>(POST_ACCESS_TABLE)
      .whereIn('ref', posts)
      .join<DatabaseResource>(RESOURCES_TABLE, 'refResource', 'id');

    return res;
  }
}
