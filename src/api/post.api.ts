/* eslint-disable class-methods-use-this */
import { Maybe, ModifyPost, NewPost, PostType, Utskott } from '../graphql.generated';
import { Logger } from '../logger';
import { StrictObject } from '../models/base';
import type { DatabasePost, DatabasePostHistory } from '../models/db/post';
import { stripObject } from '../util';
import { POSTS_HISTORY_TABLE, POSTS_TABLE } from './constants';
import knex from './knex';

const logger = Logger.getLogger('PostAPI');

/**
 * Kontrollerar att posttyp och antalet platser som
 * definierades är kompatibla. Om de är det, eller ett
 * defaultvärde kan sättas, returneras detta. Annars
 * returneras null
 *
 * @param postType
 * @param spots
 */
const checkPostTypeAndSpots = (
  postType: Maybe<PostType>,
  spots: Maybe<number> | undefined,
): number | null => {
  let s: number | null;
  if (postType === PostType.U) {
    s = 1;
  } else if (postType === PostType.Ea) {
    s = -1;
  } else if (postType === PostType.N || postType === PostType.ExactN) {
    // Om posten ska ha n möjliga platser måste spots ha
    // definierats
    if (spots !== undefined && spots !== null && spots >= 0) {
      s = spots;
    } else {
      s = null;
    }
  } else {
    s = null;
  }
  return s;
};

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
    const post = await knex<DatabasePost>(POSTS_TABLE).where({ postname }).first();

    return post ?? null;
  }

  async getMultiplePosts(postnames: string[] | readonly string[]): Promise<DatabasePost[] | null> {
    const posts = await knex<DatabasePost>(POSTS_TABLE).whereIn('postname', postnames);

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
    // Ta bort dubbletter
    const uniqueUsernames = [...new Set(usernames)];

    // Filter out already added users
    const alreadyAdded = await knex<DatabasePostHistory>(POSTS_HISTORY_TABLE)
      .select('refuser')
      .where({
        refpost: postname,
      })
      .whereIn('refuser', uniqueUsernames);

    // Knex ger oss svaren på formen [{'refuser': <username>}, {...}, ...]
    // så vi tar ut dem
    let usernamesToUse: string[];
    if (alreadyAdded.length > 0) {
      const alreadyAddedString = alreadyAdded.map((e) => e?.refuser);
      usernamesToUse = uniqueUsernames.filter((e) => !alreadyAddedString.includes(e));
    } else {
      usernamesToUse = uniqueUsernames;
    }

    // spots sätter egentligen inte en limit, det
    // är mer informativt och kan ignoreras
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

  async createPost({
    name,
    utskott,
    postType,
    spots,
    description,
    interviewRequired,
  }: NewPost): Promise<boolean> {
    const s = checkPostTypeAndSpots(postType, spots);
    if (s === null) {
      return false;
    }

    // Kolla efter dubbletter först
    const doubles = await this.getPost(name);
    if (doubles !== null) {
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

    if (res[0] > 0) {
      // If post was added successfully.
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
    const { name, ...update }: StrictObject = stripObject(entry);
    // Om vi ändrar posttyp eller antal måste detta kontrolleras
    // Får vi spots i `entry` jämför vi med det, annars måste
    // vi kolla om det är kompatibelt med databasen
    // Samma gäller åt andra hållet
    let s: number | null = null;
    if (entry.spots !== undefined) {
      if (entry.postType !== undefined) {
        s = checkPostTypeAndSpots(entry.postType, entry.spots);
      } else {
        // Vi måste kolla i databasen vad denna post har för postType
        const dbPostType = await knex<PostType>(POSTS_TABLE)
          .select('postType')
          .where('postname', name)
          .returning('posttype')
          .first();

        if (dbPostType === undefined) {
          // Should not happen
          return false;
        }

        s = checkPostTypeAndSpots(dbPostType, entry.spots);
      }
    } else if (entry.postType !== undefined) {
      // Vi har ingen ny spots, men vi har postType => kollar efter posts i DB
      const dbSpots = await knex<number>(POSTS_TABLE)
        .select('postType')
        .where('postname', name)
        .returning('number')
        .first();
      s = checkPostTypeAndSpots(entry.postType, dbSpots);
    } else {
      // Vi vill inte uppdatera något av dem
      const res = await knex<DatabasePost>(POSTS_TABLE).where('postname', name).update(update);
      return res > 0;
    }

    // Vi ville uppdatera, men vi hade inte en godkännd kombination
    if (s === null) {
      return false;
    }

    const res = await knex<DatabasePost>(POSTS_TABLE)
      .where('postname', name)
      .update({ ...update, spots: s });

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

  async getHistoryEntries(refpost: string): Promise<DatabasePostHistory[]> {
    const entries = await knex<DatabasePostHistory>(POSTS_HISTORY_TABLE).where({
      refpost,
    });

    return entries;
  }

  async getHistoryEntriesForUser(refuser: string): Promise<DatabasePostHistory[]> {
    const entries = await knex<DatabasePostHistory>(POSTS_HISTORY_TABLE).where({
      refuser,
    });

    return entries;
  }
}
