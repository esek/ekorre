/* eslint-disable class-methods-use-this */
import crypto from 'crypto';
import { NewUser, User } from '../graphql.generated';
import knex from './knex';
import auth from '../auth';
import { Logger } from '../logger';

type UserRoleConnection = {
  id: number;
  refrolename: string;
  refusername: string;
};

type DatabaseUser = Omit<User, 'roles'> & {
  passwordHash: string;
  salt: string;
};

const USER_TABLE = 'Users';
const ROLE_CONNECTION_TABLE = 'UserRoleConnection';
const logger = Logger.getLogger('UserAPI');

export default class UserAPI {
  private async applyRolesAndReduce(user: DatabaseUser): Promise<User> {
    const roles = await knex<UserRoleConnection>('UserRoleConnection')
      .select('refrolename')
      .where({ refusername: user.username })
      .pluck('refrolename');

    // Strip sensitive data! https://stackoverflow.com/a/50840024
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { salt, passwordHash, ...reduced } = user;
    const u = { ...reduced, roles };
    return u;
  }

  // Function overloading
  /**
   * Apply roles array and strip sensitive information from user.
   * @param u the user or users
   */
  private async userReducer(u: DatabaseUser): Promise<User>;
  private async userReducer(u: DatabaseUser[]): Promise<User[]>;
  private async userReducer(u: DatabaseUser | DatabaseUser[]): Promise<User | User[]> {
    if (u instanceof Array) {
      const a = await Promise.all(u.map((e) => this.applyRolesAndReduce(e)));
      return a;
    }
    return this.applyRolesAndReduce(u);
  }

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
  async getAllUsers(): Promise<User[]> {
    const u = await knex<DatabaseUser>(USER_TABLE).select('*');
    return this.userReducer(u);
  }

  /**
   * Get all users that currently have the supplied role.
   * @param role the role
   */
  async getUsersByRole(role: string): Promise<User[]> {
    const conn = await knex<UserRoleConnection>(ROLE_CONNECTION_TABLE).where({
      refrolename: role,
    });
    const refnames = conn.map((e) => e.refusername);

    const u = await knex<DatabaseUser>(USER_TABLE).whereIn('username', refnames);
    return this.userReducer(u);
  }

  /**
   * Get a single user
   * @param username the unique username
   */
  async getSingleUser(username: string): Promise<User | null> {
    const u = await knex<DatabaseUser>(USER_TABLE).where({ username }).first();
    if (u != null) {
      const nu = this.userReducer(u);
      return nu;
    }
    return null;
  }

  /**
   * Check if user credentials are correct and create a jwt token.
   * The user object that is used to create token should be fully
   * specified!!!
   * @param username the username
   * @param password the password in plaintext
   */
  async loginUser(username: string, password: string): Promise<string | null> {
    const u = await knex<DatabaseUser>(USER_TABLE)
      .select('*')
      .where({
        username,
      })
      .first();

    if (u != null) {
      if (this.verifyUser(password, u.passwordHash, u.salt)) {
        const fullUser = await this.userReducer(u);

        const token = auth.issueToken(fullUser);
        return token;
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
      if (this.verifyUser(oldPassword, u.passwordHash, u.salt)) {
        const salt = crypto.randomBytes(16).toString('base64');
        const passwordHash = this.hashPassword(newPassword, salt);
        query.update({
          salt,
          passwordHash,
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
   * Create a new user.
   * @param input the new user information
   */
  createUser(input: NewUser): User {
    const salt = crypto.randomBytes(16).toString('base64');
    const passwordHash = this.hashPassword(input.password, salt);

    const u: DatabaseUser = {
      ...input,
      passwordHash,
      salt,
    };

    knex<DatabaseUser>(USER_TABLE).insert(u);
    const logStr = `Created user ${Logger.pretty(input)}`;
    logger.info(logStr);
    logger.debug(logStr);
    return u;
  }
}
