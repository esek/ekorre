/* eslint-disable class-methods-use-this */
import { Post, HistoryEntry, Utskott, NewPost } from '../graphql.generated';
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
  private async postReduce(post: PostModel): Promise<Post> {
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
  private async postReducer(incoming: PostModel | PostModel[]): Promise<Post | Post[]> {
    if (incoming instanceof Array) {
      const posts = await Promise.all(incoming.map((e) => this.postReduce(e)));
      return posts;
    }
    return this.postReduce(incoming);
  }

  async getPost(postname: string): Promise<Post | null> {
    const post = await knex<PostModel>(POSTS_TABLE)
      .where({
        postname,
      })
      .first();

    if (post != null) return this.postReducer(post);
    return null;
  }

  /**
   * Get all posts. TODO: profile and maybe limit...
   */
  async getPosts(): Promise<Post[]> {
    const posts = await knex<PostModel>(POSTS_TABLE);

    return this.postReducer(posts);
  }

  async getPostsFromUtskott(utskott: string): Promise<Post[]> {
    const posts = await knex<PostModel>(POSTS_TABLE).where({
      utskott: utskott as Utskott,
    });

    return this.postReducer(posts);
  }

  async addUsersToPost(usernames: string[], postname: string): Promise<boolean> {
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
      start: new Date(),
    }));

    const res = await knex<PostHistoryModel>(POSTS_HISTORY_TABLE).insert(insert);

    return res[0] > 0;
  }

  async createPost({ name, access, utskott }: NewPost): Promise<boolean> {
    const res = await knex<PostModel>(POSTS_TABLE).insert({
      postname: name,
      utskott,
    });

    // If post was added successfully.
    if (res[0] > 0) {
      logger.debug(`Created a post named ${name}`);
      const accessOk = accessApi.setPostAccess(name, access);
      return accessOk;
    }
    return false;
  }

  async removeUsersFromPost(users: string[], postname: string): Promise<boolean> {
    const res = await knex<PostHistoryModel>(POSTS_HISTORY_TABLE)
      .where({
        refpost: postname,
      })
      .whereIn('refuser', users)
      .delete();
    
    return res > 0;
  }
}
