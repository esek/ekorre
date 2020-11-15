/* eslint-disable class-methods-use-this */
import crypto from 'crypto';

import type { NewUser, User } from '../graphql.generated';
import { Logger } from '../logger';
import knex from './knex';
import { USER_TABLE } from './constants';

export type DatabaseUser = Omit<User, 'posts' | 'access'> & {
  passwordhash: string;
  salt: string;
};

const logger = Logger.getLogger('UserAPI');

/**
 * This is the user api class. All operations done to
 * the database should be done using this class since it
 * will enforce business rules.
 */
export class UserAPI {
  /**
   * Verify if supplied password matches the stored hash.
   * @param input the password
   * @param hash the stored hash
   * @param salt the stored salt
   */
  private verifyUser(input: string, hash: string, salt: string): boolean {
    const equal = hash === this.hashPassword(input, salt);
    return equal;
  }

  /**
   * Hash a password with the supplied salt.
   * @param password the password
   * @param salt the randomly generated salt
   */
  private hashPassword(password: string, salt: string): string {
    const hash = crypto.pbkdf2Sync(password, Buffer.from(salt, 'base64'), 1000, 64, 'sha512');
    const hashstr = hash.toString('base64');
    return hashstr;
  }

  /**
   * Returns all users stored in the database.
   * TODO: May require pagnation and/or limiting.
   */
  async getAllUsers(): Promise<DatabaseUser[]> {
    const u = await knex<DatabaseUser>(USER_TABLE).select('*');
    return u;
  }

  /**
   * Get all users that currently have the supplied post.
   * @param postname the role
   */
  async getUsersByPost(postname: string): Promise<DatabaseUser[]> {
    const conn = await knex<PostHistoryModel>(POSTS_HISTORY_TABLE).where({
      refpost: postname,
      end: null
    });
    const refnames = conn.map((e) => e.refuser);

    const u = await knex<DatabaseUser>(USER_TABLE).whereIn('username', refnames);
    return u;
  }

  /**
   * Get a single user
   * @param username the unique username
   */
  async getSingleUser(username: string): Promise<DatabaseUser | null> {
    const u = await knex<DatabaseUser>(USER_TABLE).where({ username }).first();
    if (u != null) return u;
    return null;
  }

  /**
   * Check if user credentials are correct and return partial user.
   * @param username the username
   * @param password the password in plaintext
   */
  async loginUser(username: string, password: string): Promise<DatabaseUser | null> {
    const u = await knex<DatabaseUser>(USER_TABLE)
      .select('*')
      .where({
        username,
      })
      .first();

    if (u != null) {
      if (this.verifyUser(password, u.passwordhash, u.salt)) {
        return u;
      }
    }
    return null;
  }

  /**
   * Change password for a user.
   * @param username the username
   * @param oldPassword the old password in plaintext
   * @param newPassword the new password in plaintext
   */
  async changePassword(
    username: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const query = knex<DatabaseUser>(USER_TABLE).select('*').where({
      username,
    });
    const u = await query.first();

    if (u != null) {
      if (this.verifyUser(oldPassword, u.passwordhash, u.salt)) {
        const salt = crypto.randomBytes(16).toString('base64');
        const passwordhash = this.hashPassword(newPassword, salt);
        query.update({
          salt,
          passwordhash,
        });
        const logStr = `Changed password for user ${username}`;
        logger.info(logStr);
        logger.debug(logStr);
        return true;
      }
    }
    return false;
  }

  /**
   * Create a new user. TODO: FIX, should not return User type...
   * @param input the new user information
   */
  createUser(input: NewUser): User {
    const salt = crypto.randomBytes(16).toString('base64');
    const passwordhash = this.hashPassword(input.password, salt);

    const u: DatabaseUser = {
      ...input,
      passwordhash,
      salt,
    };

    knex<DatabaseUser>(USER_TABLE).insert(u);
    const logStr = `Created user ${Logger.pretty(input)}`;
    logger.info(logStr);
    logger.debug(logStr);
    return {
      ...input,
      access: { doors: [], web: [] }, // TODO: Maybe some default access?
      posts: [],
    };
  }
}
