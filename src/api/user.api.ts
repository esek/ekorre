/* eslint-disable class-methods-use-this */
import crypto from 'crypto';

import type { NewUser, User } from '../graphql.generated';
import { Logger } from '../logger';
import { DatabaseUser } from '../models/db/user';
import { PASSWORD_RESET_TABLE, USER_TABLE } from './constants';
import knex from './knex';

export type PasswordResetModel = {
  username: string;
  token: string;
  time: number;
};

const logger = Logger.getLogger('UserAPI');

/**
 * Det är användar api:n. Alla operationer bör göras
 * med hjälp av denna klass för den ser till att
 * allt blir rätt.
 */
export class UserAPI {
  /**
   * Verifierar om det givna lösenordet är rätt.
   * @param input lösenordet
   * @param hash den lagrade hashen
   * @param salt den lagrade salten
   */
  private verifyUser(input: string, hash: string, salt: string): boolean {
    const equal = hash === this.hashPassword(input, salt);
    return equal;
  }

  /**
   * Hasha ett lösenord med den givna salten.
   * @param password lösenordet
   * @param salt den slumpmässigt generade salten
   */
  private hashPassword(password: string, salt: string): string {
    const hash = crypto.pbkdf2Sync(password, Buffer.from(salt, 'base64'), 1000, 64, 'sha512');
    const hashstr = hash.toString('base64');
    return hashstr;
  }

  /**
   * Returnerar alla lagarade användare.
   */
  async getAllUsers(): Promise<DatabaseUser[]> {
    const u = await knex<DatabaseUser>(USER_TABLE).select('*');
    return u;
  }

  /**
   * Hämta en användare.
   * @param username det unika användarnamnet
   */
  async getSingleUser(username: string): Promise<DatabaseUser | null> {
    const u = await knex<DatabaseUser>(USER_TABLE).where({ username }).first();
    if (u != null) return u;
    return null;
  }

  /**
   * Hämta flera användare.
   * @param usernames användarnamnen
   */
  async getMultipleUsers(usernames: string[] | readonly string[]): Promise<DatabaseUser[] | null> {
    const u = await knex<DatabaseUser>(USER_TABLE).whereIn('username', usernames);
    return u ?? null;
  }

  /**
   * Kontrollera ifall inloggningen är korrekt och returnera användaren.
   * @param username användarnamnet
   * @param password lösenordet i plaintext
   */
  async loginUser(username: string, password: string): Promise<DatabaseUser | null> {
    const u = await knex<DatabaseUser>(USER_TABLE)
      .select('*')
      .where({
        username,
      })
      .first();

    if (u != null) {
      if (this.verifyUser(password, u.passwordHash, u.passwordSalt)) {
        return u;
      }
    }
    return null;
  }

  /**
   * Ändra lösenord för en användare
   * @param username användarnamnet
   * @param oldPassword det gamla lösenordet i plaintext
   * @param newPassword det nya lösenordet i plaintext
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
      if (this.verifyUser(oldPassword, u.passwordHash, u.passwordSalt)) {
        query.update(this.generateSaltAndHash(newPassword));
        const logStr = `Changed password for user ${username}`;
        logger.info(logStr);
        logger.debug(logStr);
        return true;
      }
    }
    return false;
  }

  /**
   * Skapa en ny anvädare. TODO: FIX, ska inte returnera User typ...
   * @param input den nya användarinformationen
   */
  async createUser(input: NewUser): Promise<User> {
    const { password, ...inputReduced } = input;

    const { passwordSalt, passwordHash } = this.generateSaltAndHash(password);

    const email = `${input.username}@student.lu.se`;

    const u: DatabaseUser = {
      ...inputReduced,
      email,
      passwordHash,
      passwordSalt,
    };

    await knex<DatabaseUser>(USER_TABLE).insert(u);
    const logStr = `Created user ${Logger.pretty(inputReduced)}`;
    logger.info(logStr);
    return {
      ...input,
      email,
      access: { doors: [], web: [] }, // TODO: Kanske default access?
      posts: [],
    };
  }

  async updateUser(username: string, partial: Partial<DatabaseUser>) {
    const res = await knex<DatabaseUser>(USER_TABLE).where('username', username).update(partial);
    return res > 0;
  }

  async requestPasswordReset(username: string) {
    const table = knex<PasswordResetModel>(PASSWORD_RESET_TABLE);

    const token = crypto.randomBytes(24).toString('hex');

    const res = await table.insert({
      time: Date.now(),
      token,
      username,
    });

    // If no row was inserted into the DB
    if (res.length < 1) {
      return null;
    }

    // Remove the other rows for this user
    await table.where('username', username).whereNot('token', token).delete();

    return token;
  }

  async resetPassword(token: string, username: string, password: string) {
    const q = knex<PasswordResetModel>(PASSWORD_RESET_TABLE)
      .where('token', token)
      .andWhere('username', username)
      .first();

    const dbEntry = await q;

    // 1h
    const EXPIRE_TIME = 60 * 60 * 1000;

    // If no entry or token expired
    if (!dbEntry || dbEntry.time - Date.now() > EXPIRE_TIME) {
      return false;
    }

    // Update password for user
    const usersUpdated = await knex<DatabaseUser>(USER_TABLE)
      .where('username', username)
      .update(this.generateSaltAndHash(password));

    // Delete row in password table
    await q.delete();

    return usersUpdated > 0;
  }

  private generateSaltAndHash(password: string) {
    const passwordSalt = crypto.randomBytes(16).toString('base64');
    const passwordHash = this.hashPassword(password, passwordSalt);

    return { passwordSalt, passwordHash };
  }
}
