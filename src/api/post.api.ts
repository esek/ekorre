/* eslint-disable class-methods-use-this */
import { ModifyPost, NewPost, PostType, Utskott } from '../graphql.generated';
import { Logger } from '../logger';
import { StrictObject } from '../models/base';
import type { DatabasePost, DatabasePostHistory } from '../models/db/post';
import { stripObject } from '../util';
import { POSTS_HISTORY_TABLE, POSTS_TABLE } from './constants';
import knex from './knex';

const logger = Logger.getLogger('PostAPI');

/**
 * Det här är apin för att hantera poster.
 */
export class PostAPI {
  /**
   * Hämta alla poster.
   */
  async getPosts(): Promise<DatabasePost[]> {
    const posts = await knex<DatabasePost>(POSTS_TABLE);

    return posts;
  }

  async getPost(postname: string): Promise<DatabasePost | null> {
    const posts = await knex<DatabasePost>(POSTS_TABLE).where({ postname }).first();

    return posts ?? null;
  }

  /**
   * Hämta alla poster som en användare sitter på.
   * @param username användaren
   */
  async getPostsForUser(username: string): Promise<DatabasePost[]> {
    const refposts = await knex<DatabasePostHistory>(POSTS_HISTORY_TABLE)
      .where({
        refuser: username,
        end: null,
      })
      .select('refpost');

    const posts = await knex<DatabasePost>(POSTS_TABLE).whereIn(
      'postname',
      refposts.map((e) => e.refpost),
    );

    return posts;
  }

  /**
   * Hämta alla poster som tillhör ett utskott.
   * @param utskott utskottet
   */
  async getPostsFromUtskott(utskott: Utskott): Promise<DatabasePost[]> {
    const posts = await knex<DatabasePost>(POSTS_TABLE).where({
      utskott,
    });

    return posts;
  }

  async addUsersToPost(usernames: string[], postname: string, period: number): Promise<boolean> {
    // Filter out already added users
    const alreadyAdded = ((await knex<DatabasePostHistory>(POSTS_HISTORY_TABLE)
      .select('refuser')
      .where({
        refpost: postname,
      })
      .whereIn('refuser', usernames)) as unknown) as string;
    const usernamesToUse = usernames.filter((e) => !alreadyAdded.includes(e));

    const insert = usernamesToUse.map<DatabasePostHistory>((e) => ({
      refuser: e,
      refpost: postname,
      start: new Date(),
      end: null,
      period,
    }));

    if (insert.length > 0) {
      const res = await knex<DatabasePostHistory>(POSTS_HISTORY_TABLE).insert(insert);
      return res[0] > 0;
    }
    return false;
  }

  async createPost({ name, utskott, postType, spots, description, interviewRequired }: NewPost): Promise<boolean> {
    let s: number;
    // u- och e.a.-poster har fördefinierade antal (-1 === godtyckligt)
    if (postType === PostType.U) {
      s = 1;
    } else if (postType === PostType.Ea) {
      s = -1;
    } else if (postType === PostType.N || postType === PostType.ExactN) {
      // Om posten ska ha n möjliga platser måste spots ha
      // definierats
      if (spots !== undefined && spots !== null) {
        s = spots;
      } else {
        return false;
      }
    } else {
      return false;
    }
    const res = await knex<DatabasePost>(POSTS_TABLE).insert({
      postname: name,
      utskott,
      postType,
      spots: s,
      description: description ?? 'Postbeskrivning saknas :/',
      interviewRequired: interviewRequired ?? false,
      active: true,
    });

    // If post was added successfully.
    if (res[0] > 0) {
      logger.debug(`Created a post named ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Modifierar en post
   * @param entry Modifiering av existerande artikel
   */
  async modifyPost(entry: ModifyPost): Promise<boolean> {
    // Om vi ändrar posttyp eller antal måste detta kontrolleras
    let s = entry.spots;
    if (entry.postType !== undefined) {
      if (entry.postType === PostType.U) {
        s = 1;
      } else if (entry.postType === PostType.Ea) {
        s = -1;
      } else if (entry.postType === PostType.N || entry.postType === PostType.ExactN) {
        // Om posten ska ha n möjliga platser måste spots ha
        // definierats
        if (entry.spots !== undefined && entry.spots !== null) {
          s = entry.spots;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return false;
    }

    const { name, ...update }: StrictObject = stripObject(entry);

    const res = await knex<DatabasePost>(POSTS_TABLE).where('postname', name).update({...update, spots: s});

    return res > 0;
  }

  async removeUsersFromPost(users: string[], postname: string): Promise<boolean> {
    const res = await knex<DatabasePostHistory>(POSTS_HISTORY_TABLE)
      .where({
        refpost: postname,
      })
      .whereIn('refuser', users)
      .delete();

    return res > 0;
  }

  async getHistoryEntries(refpost: string) {
    const entries = await knex<DatabasePostHistory>(POSTS_HISTORY_TABLE).where({
      refpost,
    });

    return entries;
  }
}
