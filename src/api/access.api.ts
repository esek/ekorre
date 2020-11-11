/* eslint-disable class-methods-use-this */
import { Access, AccessInput, ResourceType } from '../graphql.generated';
import { Logger } from '../logger';
import knex from './knex';

const logger = Logger.getLogger('AccessAPI');

const POST_ACCESS_TABLE = 'PostAccess';
const IND_ACCESS_TABLE = 'IndividualAccess';

type PostAccess = {
  refpostname: string;
  resourcetype: ResourceType;
  resource: string;
};

type IndividualAccess = {
  refusername: string;
  resourcetype: ResourceType;
  resource: string;
};

export default class AccessAPI {
  private accessReducer(incoming: IndividualAccess[]): Access;
  private accessReducer(incoming: PostAccess[]): Access;
  private accessReducer(incoming: PostAccess[] | IndividualAccess[]): Access {
    const initval: Access = {
      doors: [],
      web: [],
    };

    const access = (incoming as Omit<PostAccess, 'refpost'>[]).reduce((ac, e) => {
      if (e.resourcetype === ResourceType.Web) ac.web.push(e.resource);
      else if (e.resourcetype === ResourceType.Door) ac.doors.push(e.resource);
      return ac;
    }, initval);

    return access;
  }

  async getIndividualAccess(username: string): Promise<Access> {
    const res = await knex<IndividualAccess>(IND_ACCESS_TABLE).where({
      refusername: username,
    });

    return this.accessReducer(res);
  }

  async getPostAccess(postname: string): Promise<Access> {
    const res = await knex<PostAccess>(POST_ACCESS_TABLE).where({
      refpostname: postname,
    });

    return this.accessReducer(res);
  }

  async setIndividualAccess(username: string, newaccess: AccessInput): Promise<boolean> {
    await knex<IndividualAccess>(IND_ACCESS_TABLE)
      .where({
        refusername: username,
      })
      .delete();

    const webEntries = newaccess.web.map<IndividualAccess>((e) => ({
      refusername: username,
      resourcetype: ResourceType.Web,
      resource: e,
    }));
    const doorEntries = newaccess.doors.map<IndividualAccess>((e) => ({
      refusername: username,
      resourcetype: ResourceType.Door,
      resource: e,
    }));

    const status = await knex<IndividualAccess>(IND_ACCESS_TABLE).insert([
      ...webEntries,
      ...doorEntries,
    ]);
    
    return status[0] > 0;
  }
}
