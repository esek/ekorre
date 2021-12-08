/* eslint-disable class-methods-use-this */
import { BadRequestError, NotFoundError, ServerError } from '../errors/RequestErrors';
import { Maybe, ModifyPost, NewPost, PostType, Utskott } from '../graphql.generated';
import { Logger } from '../logger';
import { StrictObject } from '../models/base';
import type { DatabasePost, DatabasePostHistory } from '../models/db/post';
import { validateNonEmptyArray } from '../services/validation.service';
import { midnightTimestamp, stripObject } from '../util';
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
   * @param limit Begränsning av antal poster
   * @param includeInactive Om inaktiva poster ska inkluderas
   */
  async getPosts(limit?: number, includeInactive = true): Promise<DatabasePost[]> {
    const query = knex<DatabasePost>(POSTS_TABLE).where('active', includeInactive);

    if (!includeInactive) {
      query.where('active', true);
    }

    if (limit != null) {
      query.limit(limit);
    }

    const posts = await query;

    validateNonEmptyArray(posts, 'Inga poster hittades');

    return posts;
  }

  async getPost(postname: string): Promise<DatabasePost | null> {
    const post = await knex<DatabasePost>(POSTS_TABLE)
      .whereRaw('LOWER(postname) = ?', [postname.toLowerCase()])
      .first();

    if (!post) {
      throw new NotFoundError('Posten kunde inte hittas');
    }

    return post;
  }

  /**
   * Returnerar ett antal poster.
   * @param postnames Lista på postnamn
   * @param includeInactive Om inaktiva poster ska inkluderas
   */
  async getMultiplePosts(
    postnames: string[] | readonly string[],
    includeInactive = true,
  ): Promise<DatabasePost[]> {
    const query = knex<DatabasePost>(POSTS_TABLE).whereIn('postname', postnames);

    if (!includeInactive) {
      query.where('active', true);
    }

    const posts = await query;

    validateNonEmptyArray(posts, 'Inga poster hittades');

    return posts;
  }

  /**
   * Hämta alla poster som en användare sitter på.
   * @param username användaren
   * @param includeInactive Om inaktiva poster ska inkluderas
   */
  async getPostsForUser(username: string, includeInactive = true): Promise<DatabasePost[]> {
    const refposts = await knex<DatabasePostHistory>(POSTS_HISTORY_TABLE)
      .where({
        refuser: username,
      })
      .andWhere((q) => {
        // Antingen ska vara null, eller efter dagens datum
        q.whereNull('end').orWhere('end', '>', new Date().getTime());
      })
      .select('refpost');

    const query = knex<DatabasePost>(POSTS_TABLE).whereIn(
      'postname',
      refposts.map((e) => e.refpost),
    );

    if (!includeInactive) {
      query.where('active', true);
    }

    const posts = await query;

    validateNonEmptyArray(posts, 'Inga poster hittades');

    return posts;
  }

  /**
   * Hämta alla poster som tillhör ett utskott.
   * @param utskott utskottet
   * @param includeInactive Om inaktiva poster ska inkluderas
   */
  async getPostsFromUtskott(utskott: Utskott, includeInactive = true): Promise<DatabasePost[]> {
    const query = knex<DatabasePost>(POSTS_TABLE).where({
      utskott,
    });

    if (!includeInactive) {
      query.where('active', true);
    }

    const posts = await query;

    validateNonEmptyArray(posts, 'Inga poster hittades');

    return posts;
  }

  async addUsersToPost(
    usernames: string[],
    postname: string,
    start?: Date,
    end?: Date,
  ): Promise<boolean> {
    // Ta bort dubbletter
    const uniqueUsernames = [...new Set(usernames)];

    // spots sätter egentligen inte en limit, det
    // är mer informativt och kan ignoreras
    const insert = uniqueUsernames.map<DatabasePostHistory>((e) => ({
      refuser: e,
      refpost: postname,

      // Vi sparar som timestamp i DB
      // Start ska alltid vara 00:00, end alltid 23:59
      start: midnightTimestamp(start != null ? start : new Date(), 'after'),
      end: end != null ? midnightTimestamp(end, 'before') : undefined,
    }));

    if (!insert.length) {
      throw new ServerError('Användaren kunde inte läggas till');
    }

    const res = await knex<DatabasePostHistory>(POSTS_HISTORY_TABLE).insert(insert);
    return res[0] > 0;
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

    // Kolla efter dubbletter först, fånga 404-felet och sätt doubles till false
    const doubles = await this.getPost(name).catch(() => false);

    if (doubles) {
      throw new BadRequestError('Denna posten finns redan');
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

    throw new ServerError('Posten kunde inte skapas');
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
      throw new BadRequestError('Ogiltig kombination av post och antal platser');
    }

    const res = await knex<DatabasePost>(POSTS_TABLE)
      .where('postname', name)
      .update({ ...update, spots: s });

    return res > 0;
  }

  /**
   * Markerar en post som aktiv.
   * @param postname Namnet på posten
   * @returns Om en uppdatering gjordes
   */
  async activatePost(postname: string): Promise<boolean> {
    const res = await knex<DatabasePost>(POSTS_TABLE).update('active', true).where({ postname });

    return res > 0;
  }

  /**
   * Markerar en post som inaktiv.
   * @param postname Namnet på posten
   * @returns Om en uppdatering gjordes
   */
  async deactivatePost(postname: string): Promise<boolean> {
    const res = await knex<DatabasePost>(POSTS_TABLE).update('active', false).where({ postname });

    return res > 0;
  }

  async getHistoryEntries(refpost: string): Promise<DatabasePostHistory[]> {
    const entries = await knex<DatabasePostHistory>(POSTS_HISTORY_TABLE).where({
      refpost,
    });

    validateNonEmptyArray(entries, 'Ingen posthistorik hittades');

    return entries;
  }

  async getHistoryEntriesForUser(refuser: string): Promise<DatabasePostHistory[]> {
    const entries = await knex<DatabasePostHistory>(POSTS_HISTORY_TABLE).where({
      refuser,
    });

    return entries;
  }

  /**
   * Beräknar antalet unika funktionärer för ett visst
   * datum, eller dagens datum om inget ges. Räknar inte samma
   * användare flera gånger.
   * @param date Ett datum
   */
  async getNumberOfVolunteers(date?: Date): Promise<number> {
    const safeDate = date ?? new Date();
    const timestamp = safeDate.getTime();

    // Om `end` är `null` har man inte gått av posten
    const i = await knex<DatabasePostHistory>(POSTS_HISTORY_TABLE)
      .where('start', '<=', timestamp)
      .andWhere((q) => {
        // Antingen är end efter datumet, eller så är det null (inte gått av)
        q.andWhere('end', '>=', timestamp).orWhereNull('end');
      })
      .distinct('refuser') // Vi vill inte räkna samma person flera gånger
      .count<Record<string, number>>('refuser AS count') // Så att vi får `i.count`
      .first();

    if (i == null || i.count == null) {
      logger.debug(
        `Kunde inte räkna antalet funktionärer för datumet ${new Date(timestamp).toISOString()}'
        }, count var ${JSON.stringify(i)}`,
      );
      throw new ServerError('Kunde inte räkna antal förslag');
    }

    return i.count;
  }

  /**
   * Sätter slutdatumet för en användares post.
   * @param username Användarnamn
   * @param postname Namnet på posten
   * @param start När personen går på posten (statiskt för en HistoryEntry)
   * @param end När posten går av posten
   */
  async setUserPostEnd(
    username: string,
    postname: string,
    start: Date,
    end: Date,
  ): Promise<boolean> {
    const res = await knex<DatabasePostHistory>(POSTS_HISTORY_TABLE)
      .update('end', midnightTimestamp(end, 'before'))
      .where({
        refuser: username,
        refpost: postname,
        start: midnightTimestamp(start, 'after'),
      });

    if (res === 0) {
      throw new NotFoundError('Kunde inte uppdatera posthistoriken');
    }

    return true;
  }

  /**
   * Tar bort en `PostHistoryEntry` ur databasen.
   * @param username Användarnamn
   * @param postname Namnet på posten
   * @param start När personen gick på posten
   * @param end Om applicerbart; När personen går/gick av posten
   */
  async removeHistoryEntry(
    username: string,
    postname: string,
    start: Date,
    end?: Date,
  ): Promise<boolean> {
    const query = knex<DatabasePostHistory>(POSTS_HISTORY_TABLE)
      .delete()
      .where({
        refuser: username,
        refpost: postname,
        start: midnightTimestamp(start, 'after'),
      })
      .limit(1); // Vi kör skyddat

    if (end != null) {
      query.where('end', midnightTimestamp(end, 'before'));
    }

    const res = await query;

    if (res === 0) {
      throw new NotFoundError('HistoryEntry hittades inte och kunde inte tas bort');
    }

    return true;
  }
}
