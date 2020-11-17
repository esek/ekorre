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
 * This is the api for adding and removing user access.
 */
export class AccessAPI {
  /**
   * Reduce access model array to single access object
   * @param incoming the database rows
   */
  private accessReducer(incoming: AccessModel[]): Access {
    const initval: Access = {
      doors: [],
      web: [],
    };

    const access = incoming.reduce((ac, e) => {
      if (e.resourcetype === ResourceType.Web) ac.web.push(e.resource);
      else if (e.resourcetype === ResourceType.Door) ac.doors.push(e.resource);
      return ac;
    }, initval);

    return access;
  }

  /**
   * Get access for a single user
   * @param username the user
   */
  async getIndividualAccess(username: string): Promise<Access> {
    const res = await knex<AccessModel>(IND_ACCESS_TABLE).where({
      ref: username,
    });

    return this.accessReducer(res);
  }

  /**
   * Get access for a single post
   * @param postname the postname
   */
  async getPostAccess(postname: string): Promise<Access> {
    const res = await knex<AccessModel>(POST_ACCESS_TABLE).where({
      ref: postname,
    });

    return this.accessReducer(res);
  }

  /**
   * A private helper function for setting access
   * @param table the table where access rows reside
   * @param ref the foregin key value
   * @param newaccess the new access
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
   * Sets access for a user. NOTE: Access is immutable, be sure all
   * access is in the `newaccess` variable
   * @param username the username
   * @param newaccess the new access
   */
  async setIndividualAccess(username: string, newaccess: AccessInput): Promise<boolean> {
    const status = this.setAccess(IND_ACCESS_TABLE, username, newaccess);
    logger.info(`Updated access for user ${username}`);
    logger.debug(`Updated access for user ${username} to ${Logger.pretty(newaccess)}`);
    return status;
  }

  /**
   * Sets access for a post. NOTE: Access is immutable, be sure all
   * access is in the `newaccess` variable
   * @param postname the postname
   * @param newaccess the new access
   */
  async setPostAccess(postname: string, newaccess: AccessInput): Promise<boolean> {
    const status = this.setAccess(POST_ACCESS_TABLE, postname, newaccess);
    logger.info(`Updated access for post ${postname}`);
    logger.debug(`Updated access for post ${postname} to ${Logger.pretty(newaccess)}`);
    return status;
  }

  /**
   * Gets access for multiple posts. Useful in user api.
   * @param posts the postnames
   */
  async getAccessForPosts(posts: string[]): Promise<Access> {
    const res = await knex<AccessModel>(POST_ACCESS_TABLE).whereIn('ref', posts);

    return this.accessReducer(res);
  }
}
