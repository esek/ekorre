/* eslint-disable class-methods-use-this */
import type { Post, HistoryEntry, Utskott, NewPost } from '../graphql.generated';
import { Logger } from '../logger';
import { POSTS_HISTORY_TABLE, POSTS_TABLE } from './constants';
import knex from './knex';

const logger = Logger.getLogger('PostAPI');

export type PostModel = Omit<Post, 'history' | 'access'>;
export type PostHistoryModel = Omit<HistoryEntry, 'holder'> & {
  refpost: string;
  refuser: string;
  period: number;
};

/**
 * Det här är apin för att hantera poster.
 */
export class PostAPI {
  /**
   * Hämta alla poster.
   */
  async getPosts(): Promise<PostModel[]> {
    const posts = await knex<PostModel>(POSTS_TABLE);

    return posts;
  }

  async getPost(postname: string): Promise<PostModel | null> {
    const posts = await knex<PostModel>(POSTS_TABLE).where({ postname }).first();

    return posts ?? null;
  }

  /**
   * Hämta alla poster som en användare sitter på.
   * @param username användaren
   */
  async getPostsForUser(username: string): Promise<PostModel[]> {
    const refposts = (await knex<PostHistoryModel>(POSTS_HISTORY_TABLE)
      .where({
        refuser: username,
        end: null,
      })
      .select('refpost'));

    const posts = await knex<PostModel>(POSTS_TABLE).whereIn('postname', refposts.map(e => e.refpost));

    return posts;
  }

  /**
   * Hämta alla poster som tillhör ett utskott.
   * @param utskott utskottet
   */
  async getPostsFromUtskott(utskott: Utskott): Promise<PostModel[]> {
    const posts = await knex<PostModel>(POSTS_TABLE).where({
      utskott,
    });

    return posts;
  }

  async addUsersToPost(usernames: string[], postname: string, period: number): Promise<boolean> {
    // Filter out already added users
    const alreadyAdded = ((await knex<PostHistoryModel>(POSTS_HISTORY_TABLE)
      .select('refuser')
      .where({
        refpost: postname,
      })
      .whereIn('refuser', usernames)) as unknown) as string;
    const usernamesToUse = usernames.filter((e) => !alreadyAdded.includes(e));

    const insert = usernamesToUse.map<PostHistoryModel>((e) => ({
      refuser: e,
      refpost: postname,
      start: new Date(),
      end: null,
      period,
    }));

    if (insert.length > 0) {
      const res = await knex<PostHistoryModel>(POSTS_HISTORY_TABLE).insert(insert);
      return res[0] > 0;
    }
    return false;
  }

  async createPost({ name, utskott }: NewPost): Promise<boolean> {
    const res = await knex<PostModel>(POSTS_TABLE).insert({
      postname: name,
      utskott,
    });

    // If post was added successfully.
    if (res[0] > 0) {
      logger.debug(`Created a post named ${name}`);
      return true;
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

  async getHistoryEntries(refpost: string) {
    const entries = await knex<PostHistoryModel>(POSTS_HISTORY_TABLE).where({
      refpost,
    });

    return entries;
  }
}
