/* eslint-disable class-methods-use-this */
import { Logger } from '@/logger';
import { DatabaseForgotPassword } from '@db/forgotpassword';
import { DatabaseUser } from '@db/user';
import type { NewUser } from '@generated/graphql';
import crypto from 'crypto';

import {
  BadRequestError,
  NotFoundError,
  ServerError,
  UnauthenticatedError,
} from '../errors/RequestErrors';
import { PASSWORD_RESET_TABLE, USER_TABLE } from './constants';
import db from './knex';

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
    const u = await db<DatabaseUser>(USER_TABLE).select('*');
    return u;
  }

  /**
   * Hämta en användare.
   * @param username det unika användarnamnet
   */
  async getSingleUser(username: string): Promise<DatabaseUser> {
    const u = await db<DatabaseUser>(USER_TABLE).where({ username }).first();

    if (u == null) {
      throw new NotFoundError('Användaren kunde inte hittas');
    }

    return u;
  }

  /**
   * Hämta flera användare.
   * @param usernames användarnamnen
   */
  async getMultipleUsers(usernames: string[] | readonly string[]): Promise<DatabaseUser[]> {
    const u = await db<DatabaseUser>(USER_TABLE).whereIn('username', usernames);

    return u;
  }

  async searchUser(search: string): Promise<DatabaseUser[]> {
    const users = await db<DatabaseUser>(USER_TABLE)
      .where('username', 'like', `%${search}%`)
      .orWhere('firstName', 'like', `%${search}%`)
      .orWhere('lastName', 'like', `%${search}%`);

    return users;
  }

  /**
   * Kontrollera ifall inloggningen är korrekt och returnera användaren.
   * @param username användarnamnet
   * @param password lösenordet i plaintext
   */
  async loginUser(username: string, password: string): Promise<DatabaseUser> {
    const u = await db<DatabaseUser>(USER_TABLE)
      .select('*')
      .where({
        username,
      })
      .first();

    if (u == null) {
      throw new NotFoundError('Användaren finns inte');
    }

    if (!this.verifyUser(password, u.passwordHash, u.passwordSalt)) {
      throw new UnauthenticatedError('Inloggningen misslyckades');
    }

    return u;
  }

  /**
   * Ändra lösenord för en användare
   * @param username användarnamnet
   * @param oldPassword det gamla lösenordet i plaintext
   * @param newPassword det nya lösenordet i plaintext
   */
  async changePassword(username: string, oldPassword: string, newPassword: string): Promise<void> {
    const query = db<DatabaseUser>(USER_TABLE).select('*').where({
      username,
    });
    const u = await query.first();

    if (u == null) {
      throw new NotFoundError('Användaren finns inte');
    }

    if (!this.verifyUser(oldPassword, u.passwordHash, u.passwordSalt)) {
      throw new UnauthenticatedError('Lösenordet stämmer ej översens med det som redan är sparat');
    }

    await query.update(this.generateSaltAndHash(newPassword));

    const logStr = `Changed password for user ${username}`;
    logger.info(logStr);
  }

  /**
   * Skapa en ny anvädare. TODO: FIX, ska inte returnera User typ...
   * @param input den nya användarinformationen
   */
  async createUser(input: NewUser): Promise<DatabaseUser> {
    // Utgå från att det inte är en funktionell användare om inget annat ges
    const isFuncUser = !!input.isFuncUser; // Trick för att konvertera till bool

    const { password, ...inputReduced } = input;

    if (password === '') {
      throw new BadRequestError('Ogiltigt lösenord');
    }

    const { passwordSalt, passwordHash } = this.generateSaltAndHash(password);

    let { username = '' } = input;

    // Inga tomma användarnamn och får inte starta med funcUser om de inte är det
    if (username === '' || (username.startsWith('funcUser_') && !isFuncUser)) {
      throw new BadRequestError('Ogiltigt användarnamn');
    }

    // We cannot be sure what email is
    let { email } = input;
    if (!email || email === '') {
      email = `${username}@student.lu.se`;
    }

    if (isFuncUser) {
      const prefix = 'funcUser_';
      username = username.startsWith(prefix) ? username : `${prefix}${username}`;
      email = 'no-reply@esek.se';
    }

    const user: DatabaseUser = {
      ...inputReduced,
      username,
      email,
      passwordHash,
      passwordSalt,
      isFuncUser,
    };

    await db<DatabaseUser>(USER_TABLE)
      .insert(user)
      .catch(() => {
        // If failed, it's 99% because the username exists
        throw new BadRequestError('Användarnamnet finns redan');
      });

    const logStr = `Created user ${Logger.pretty(inputReduced)}`;
    logger.info(logStr);

    return user;
  }

  async updateUser(username: string, partial: Partial<DatabaseUser>): Promise<void> {
    if (partial.username) {
      throw new BadRequestError('Användarnamn kan inte uppdateras');
    }

    const res = await db<DatabaseUser>(USER_TABLE).where('username', username).update(partial);

    if (res <= 0) {
      throw new BadRequestError('Något gick fel');
    }
  }

  async requestPasswordReset(username: string): Promise<string> {
    const table = db<DatabaseForgotPassword>(PASSWORD_RESET_TABLE);

    const token = crypto.randomBytes(24).toString('hex');

    const res = await table.insert({
      time: Date.now(),
      token,
      username,
    });

    // If no row was inserted into the DB
    if (res.length < 1) {
      throw new ServerError('Något gick fel');
    }

    // Remove the other rows for this user
    await table.where('username', username).whereNot('token', token).delete();

    return token;
  }

  async validateResetPasswordToken(username: string, token: string): Promise<boolean> {
    const row = await db<DatabaseForgotPassword>(PASSWORD_RESET_TABLE)
      .where('username', username)
      .where('token', token)
      .first();

    return this.validateResetPasswordRow(row);
  }

  async resetPassword(token: string, username: string, password: string): Promise<void> {
    const q = db<DatabaseForgotPassword>(PASSWORD_RESET_TABLE)
      .where('token', token)
      .andWhere('username', username)
      .first();

    const dbEntry = await q;

    // If no entry or token expired
    if (!this.validateResetPasswordRow(dbEntry)) {
      throw new NotFoundError('Denna förfrågan finns inte eller har gått ut');
    }

    // Update password for user
    await db<DatabaseUser>(USER_TABLE)
      .where('username', username)
      .update(this.generateSaltAndHash(password));

    // Delete row in password table
    await q.delete();
  }

  private validateResetPasswordRow(row?: DatabaseForgotPassword): boolean {
    if (!row) {
      return false;
    }

    const EXPIRE_MINUTES = 60; // 1h

    const expirationTime = Date.now() - row.time;

    return expirationTime < EXPIRE_MINUTES * 60 * 1000;
  }

  private generateSaltAndHash(password: string): { passwordSalt: string; passwordHash: string } {
    const passwordSalt = crypto.randomBytes(16).toString('base64');
    const passwordHash = this.hashPassword(password, passwordSalt);

    return { passwordSalt, passwordHash };
  }
}
