import { ServerError } from '../errors/RequestErrors';
import { ResolverType } from '../graphql.generated';
import { Logger } from '../logger';
import type { DatabaseAccess } from '../models/db/access';
import { DatabaseAccessMapping } from '../models/db/accessmapping';
import { DatabasePost, DatabasePostHistory } from '../models/db/post';
import { DatabaseAccessResource } from '../models/db/resource';
import {
  ACCESS_MAPPINGS_TABLE,
  ACCESS_RESOURCES_TABLE,
  IND_ACCESS_TABLE,
  POSTS_HISTORY_TABLE,
  POSTS_TABLE,
  POST_ACCESS_TABLE,
} from './constants';
import db from './knex';

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
    const res = await db<DatabaseAccess>(IND_ACCESS_TABLE)
      .where({
        refname: username,
      })
      .join<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE, 'refaccessresource', 'slug');

    return res;
  }

  /**
   * Hämta access för en post.
   * @param postname posten
   */
  async getPostAccess(postname: string): Promise<DatabaseJoinedAccess[]> {
    const res = await db<DatabaseAccess>(POST_ACCESS_TABLE)
      .where({
        refname: postname,
      })
      .join<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE, 'refaccessresource', 'slug');

    return res;
  }

  /**
   * En private hjälpfunktion för att sätta access.
   * @param table tabellen där access raderna finns
   * @param ref referens (användare eller post)
   * @param newaccess den nya accessen
   */
  private async setAccess(table: string, ref: string, newaccess: string[]): Promise<boolean> {
    await db<DatabaseAccess>(table)
      .where({
        refname: ref,
      })
      .delete();

    // Only do insert with actual values.
    const inserts = newaccess.map<DatabaseAccess>((id) => ({
      refname: ref,
      refaccessresource: id,
    }));

    if (inserts.length > 0) {
      const status = await db<DatabaseAccess>(table).insert(inserts);
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
  async setIndividualAccess(username: string, newaccess: string[]): Promise<boolean> {
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
  async setPostAccess(postname: string, newaccess: string[]): Promise<boolean> {
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
    const query = db<DatabaseAccess>(POST_ACCESS_TABLE)
      .whereIn('refname', posts)
      .join<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE, 'refaccessresource', 'slug')
      .select<DatabaseJoinedAccess[]>('*', `${ACCESS_RESOURCES_TABLE}.description`);

    // Om inaktiva posters access inte ska inkluderas,
    // ta in `POSTS_TABLE` och se vilka som är aktiva
    if (!includeInactivePosts) {
      query.innerJoin<DatabasePost>(POSTS_TABLE, 'refname', 'postname').where('active', true);
    }

    const res = await query;

    return res;
  }

  /**
   * Gets the users access with respect to what posts they have
   * @param username The user to get
   * @returns A list of all the accessable resources
   */
  async getUserPostAccess(username: string) {
    const res = await db<DatabaseAccess>(POST_ACCESS_TABLE)
      .join<DatabaseAccessResource>(ACCESS_RESOURCES_TABLE, 'refaccessresource', 'slug')
      .join<DatabasePostHistory>(POSTS_HISTORY_TABLE, 'refpost', 'refname')
      .where({
        refuser: username,
      })
      .andWhere((q) => {
        // Only fetch active posts
        q.whereNull('end').orWhere('end', '>', new Date().getTime());
      })
      .distinct(); // remove any duplicates

    return res;
  }

  /**
   * Gets a users entire access, including inherited access from posts
   * @param username The user whose access to get
   * @returns A list of databaseaccess objects
   */
  async getUserFullAccess(username: string): Promise<DatabaseJoinedAccess[]> {
    // Get the individual access for that user
    const individual = this.getIndividualAccess(username);
    // Get the postaccess for that users posts
    const post = this.getUserPostAccess(username);

    const p = await Promise.all([individual, post]);

    // Flatten the array of access from the promises
    return p.flat();
  }

  /**
   * Gets the mapping for a resource
   * @param resolverType The type of resource (query or mutation)
   * @param resolverName The name of the resource
   * @returns A list of mappings
   */
  async getAccessMapping(
    resolverName?: string,
    resolverType?: ResolverType,
  ): Promise<DatabaseAccessMapping[]> {
    const q = db<DatabaseAccessMapping>(ACCESS_MAPPINGS_TABLE);

    if (resolverName) {
      q.where({ resolverName });
    }

    if (resolverType) {
      q.where({ resolverType });
    }

    const resources = await q;

    return resources;
  }

  /**
   * Sets (overrides) the mapping for a resolver
   * @param {string} resolverName The name of the resolver
   * @param {string} resolverType The type of the resolver
   * @param {string} slugs The slugs of the resoures to set
   * @returns {boolean} True if successful
   */
  async setAccessMappings(
    resolverName: string,
    resolverType: ResolverType,
    slugs?: string[],
  ): Promise<boolean> {
    const q = db<DatabaseAccessMapping>(ACCESS_MAPPINGS_TABLE);

    await q
      .where({
        resolverName,
        resolverType,
      })
      .delete();

    // if we have anything to add
    if (slugs) {
      try {
        await q.insert(slugs.map((s) => ({ refaccessresource: s, resolverName, resolverType })));
      } catch {
        throw new ServerError('Kunde inte skapa mappningen av resursen');
      }
    }

    return true;
  }
}
