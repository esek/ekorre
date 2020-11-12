/* eslint-disable class-methods-use-this */
import { Post, HistoryEntry, Utskott } from '../graphql.generated';
import { Logger } from '../logger';
import AccessAPI from './access.api';
import knex from './knex';

const logger = Logger.getLogger('PostAPI');
const accessApi = new AccessAPI();

const POSTS_TABLE = 'Posts';
const POSTS_HISTORY_TABLE = '';

export type PostModel = Omit<Post, 'history' | 'access'>;
export type PostHistoryModel = Omit<HistoryEntry, 'holders'> & {
  refpost: string;
  refuser: string;
};

/**
 * This is the api for handling posts.
 */
export default class PostAPI {
  private async postReduce(post: PostModel) {
    const access = await accessApi.getPostAccess(post.postname);
    const history: HistoryEntry[] = [];

    const p: Post = {
      ...post,
      access,
      history,
    };

    return p;
  }

  private async postReducer(incoming: PostModel): Promise<Post>;
  private async postReducer(incoming: PostModel[]): Promise<Post[]>;
  private async postReducer(incoming: PostModel | PostModel[]) {
    if (incoming instanceof Array) {
      const posts = await Promise.all(incoming.map((e) => this.postReduce(e)));
      return posts;
    }
    return this.postReduce(incoming);
  }

  async getPost(postname: string) {
    const post = await knex<PostModel>(POSTS_TABLE)
      .where({
        postname,
      })
      .first();

    if (post != null) return this.postReducer(post);
    return null;
  }

  async getPosts(utskott: string) {
    const posts = await knex<PostModel>(POSTS_TABLE).where({
      utskott: utskott as Utskott,
    });

    return this.postReducer(posts);
  }

  async addUsersToPost(usernames: string[], postname: string) {
    // Filter out already added users
    const alreadyAdded = ((await knex<PostHistoryModel>(POSTS_HISTORY_TABLE)
      .select('refuser')
      .where({
        refpost: postname,
      })
      .whereIn('refuser', usernames)) as unknown) as string;
    const usernamesToUse = usernames.filter((e) => alreadyAdded.includes(e));

    const insert = usernamesToUse.map<PostHistoryModel>((e) => ({
      refuser: e,
      refpost: postname,
      start: new Date()
    }));

    const res = await knex<PostHistoryModel>(POSTS_HISTORY_TABLE).insert(insert);

    return res[0] > 0;
  }
}
