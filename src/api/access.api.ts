/* eslint-disable class-methods-use-this */
import { Access, AccessInput, ResourceType } from '../graphql.generated';
import { Logger } from '../logger';
import { IND_ACCESS_TABLE, POST_ACCESS_TABLE } from './constants';
import knex from './knex';

const logger = Logger.getLogger('AccessAPI');

export type AccessModel = {
  ref: string;
  resourcetype: ResourceType;
  resource: string;
};

/**
 * Det är api:n som hanterar access.
 * Access finns i två former:
 *   - Den access som en användare ärver från en post
 *   - Den access som en specifik användare får tilldelad
 * Det är viktigt att hålla koll på denna skillnaden.
 */
export class AccessAPI {
  /**
   * Reducera access arrays till ett access objekt.
   * TODO: Gör en reducer istället
   * @param incoming databasraderna
   */
  private accessReducer(incoming: AccessModel[]): Access {
    const initval: Access = {
      doors: [],
      web: [],
    };

    const access = incoming.reduce((ac, e) => {
      switch (e.resourcetype) {
        case ResourceType.Web:
          ac.web.push(e.resource);
          break;
        case ResourceType.Door:
          ac.doors.push(e.resource);
          break;
        default:
          break;
      }
      return ac;
    }, initval);

    return access;
  }

  /**
   * Hämta specifik access för en användare
   * @param username användaren
   */
  async getIndividualAccess(username: string): Promise<Access> {
    const res = await knex<AccessModel>(IND_ACCESS_TABLE).where({
      ref: username,
    });

    return this.accessReducer(res);
  }

  /**
   * Hämta access för en post.
   * @param postname posten
   */
  async getPostAccess(postname: string): Promise<Access> {
    const res = await knex<AccessModel>(POST_ACCESS_TABLE).where({
      ref: postname,
    });

    return this.accessReducer(res);
  }

  /**
   * En private hjälpfunktion för att sätta access.
   * @param table tabellen där access raderna finns
   * @param ref referens (användare eller post)
   * @param newaccess den nya accessen
   */
  private async setAccess(table: string, ref: string, newaccess: AccessInput): Promise<boolean> {
    await knex<AccessModel>(table)
      .where({
        ref,
      })
      .delete();

    const webEntries = newaccess.web.map<AccessModel>((e) => ({
      ref,
      resourcetype: ResourceType.Web,
      resource: e,
    }));
    const doorEntries = newaccess.doors.map<AccessModel>((e) => ({
      ref,
      resourcetype: ResourceType.Door,
      resource: e,
    }));

    // Only do insert with actual values.
    const inserts = [...webEntries, ...doorEntries];
    if (inserts.length > 0) {
      const status = await knex<AccessModel>(table).insert(inserts);
      return status[0] > 0;
    }
    return true;
  }

  /**
   * Sätt access för en användare. VIKTIGT: Access är icke muterbart
   * vilket innebär att accessobjektet som matas ska innehålla allt
   * som behövs.
   * @param username användaren
   * @param newaccess den nya accessen
   */
  async setIndividualAccess(username: string, newaccess: AccessInput): Promise<boolean> {
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
  async setPostAccess(postname: string, newaccess: AccessInput): Promise<boolean> {
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
  async getAccessForPosts(posts: string[]): Promise<Access> {
    const res = await knex<AccessModel>(POST_ACCESS_TABLE).whereIn('ref', posts);

    return this.accessReducer(res);
  }
}
