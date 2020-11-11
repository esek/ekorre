/* eslint-disable class-methods-use-this */
import { Access, AccessInput, ResourceType } from '../graphql.generated';
import { Logger } from '../logger';
import { access } from '../resolvers';
import knex from './knex';

const logger = Logger.getLogger('AccessAPI');

const POST_ACCESS_TABLE = 'PostAccess';
const IND_ACCESS_TABLE = 'IndividualAccess';

// TODO: Combine these into one?
type AccessModel = {
  ref: string;
  resourcetype: ResourceType;
  resource: string;
};

export default class AccessAPI {
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

  async getIndividualAccess(username: string): Promise<Access> {
    const res = await knex<AccessModel>(IND_ACCESS_TABLE).where({
      ref: username,
    });

    return this.accessReducer(res);
  }

  async getPostAccess(postname: string): Promise<Access> {
    const res = await knex<AccessModel>(POST_ACCESS_TABLE).where({
      ref: postname,
    });

    return this.accessReducer(res);
  }

  private async setAccess(table: string, ref: string, newaccess: AccessInput): Promise<boolean> {
    await knex<AccessModel>(table)
      .where({
        ref
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

    const status = await knex<AccessModel>(table).insert([
      ...webEntries,
      ...doorEntries,
    ]);
    
    return status[0] > 0;
  }

  async setIndividualAccess(username: string, newaccess: AccessInput): Promise<boolean> {
    const status = this.setAccess(IND_ACCESS_TABLE, username, newaccess);
    return status;
  }

  async setPostAccess(postname: string, newaccess: AccessInput): Promise<boolean> {
    const status = this.setAccess(POST_ACCESS_TABLE, postname, newaccess);
    return status;
  }
}
