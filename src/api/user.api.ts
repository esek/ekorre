/* eslint-disable class-methods-use-this */
import { Logger } from '@/logger';
import { user } from '@/resolvers';
import type { NewUser } from '@generated/graphql';
import { Prisma, PrismaPasswordReset, PrismaUser } from '@prisma/client';
import crypto from 'crypto';

import {
  BadRequestError,
  NotFoundError,
  ServerError,
  UnauthenticatedError,
} from '../errors/request.errors';
import prisma from './prisma';

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
  async getAllUsers(): Promise<PrismaUser[]> {
    const users = await prisma.prismaUser.findMany();
    return users;
  }

  /**
   * Hämta en användare.
   * @param username det unika användarnamnet
   */
  async getSingleUser(username: string): Promise<PrismaUser> {
    const u = await prisma.prismaUser.findFirst({
      where: {
        username,
      },
    });

    if (u == null) {
      throw new NotFoundError('Användaren kunde inte hittas');
    }

    return u;
  }

  /**
   * Hämta flera användare.
   * @param usernames användarnamnen
   */
  async getMultipleUsers(usernames: string[]): Promise<PrismaUser[]> {
    const u = await prisma.prismaUser.findMany({
      where: {
        username: {
          in: usernames,
        },
      },
    });

    return u;
  }

  /**
   * Returns all users matching a search, where a match is any `User` where
   * their first name, last name, or username, contains the passed string. Is case _insensitive_
   * @param search An (optionally) space-separated string containing first name, last name, or username, or a combination
   * @returns A list of users matching the search
   */
  async searchUser(search: string): Promise<PrismaUser[]> {
    if (search.length === 0) {
      throw new BadRequestError('Search must contain at least one symbol');
    }
    
    // We do a search by using $queryRaw's power to escape search terms, and
    // concat a lowercase version of the database first name, last name, and username,
    // and then want everything that fits for all parts of the search to some part
    // (% around strings are for `LIKE`)
    const searchArray = search.toLowerCase().split(/\s+/g).map((s) => `%${s}%`);
    const users = await prisma.$queryRaw`
      SELECT username, password_hash AS "passwordHash", password_salt AS "passwordSalt",
      first_name AS "firstName", last_name AS "lastName", class, photo_url AS "photoUrl",
      email, phone, address, zip_code AS "zipCode", website, date_joined AS "dateJoined"
      FROM users
      WHERE lower(concat(first_name, last_name, username))
      LIKE ${
        Prisma.join(searchArray,
        ' AND lower(concat(first_name, last_name, username)) LIKE ')
      }
    `;
    
    return users as PrismaUser[];
  }

  async getNumberOfMembers(): Promise<number> {
    const count = await prisma.prismaUser.count();

    return count;
  }

  /**
   * Kontrollera ifall inloggningen är korrekt och returnera användaren.
   * @param username användarnamnet
   * @param password lösenordet i plaintext
   */
  async loginUser(username: string, password: string): Promise<PrismaUser> {
    const user = await prisma.prismaUser.findFirst({
      where: {
        username,
      },
    });

    if (user == null) {
      throw new NotFoundError('Användaren finns inte');
    }

    if (!this.verifyUser(password, user.passwordHash, user.passwordSalt)) {
      throw new UnauthenticatedError('Inloggningen misslyckades');
    }

    return user;
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
    const user = await prisma.prismaUser.findFirst({
      where: {
        username,
      },
    });

    if (user == null) {
      throw new NotFoundError('Användaren finns inte');
    }

    if (!this.verifyUser(oldPassword, user.passwordHash, user.passwordSalt)) {
      throw new UnauthenticatedError('Lösenordet stämmer ej översens med det som redan är sparat');
    }

    const updated = await prisma.prismaUser.update({
      where: {
        username,
      },
      data: {
        ...this.generateSaltAndHash(newPassword),
      },
    });

    const logStr = `Changed password for user ${username}`;
    logger.info(logStr);

    return updated != null;
  }

  /**
   * Skapa en ny anvädare. TODO: FIX, ska inte returnera User typ...
   * @param input den nya användarinformationen
   */
  async createUser(input: NewUser): Promise<PrismaUser> {
    const { password, ...inputReduced } = input;

    if (password === '') {
      throw new BadRequestError('Ogiltigt lösenord');
    }

    const { passwordSalt, passwordHash } = this.generateSaltAndHash(password);

    const { username } = input;

    // Inga tomma användarnamn
    if (username === '') {
      throw new BadRequestError('Ogiltigt användarnamn');
    }

    // We cannot be sure what email is
    let { email } = input;

    if (!email || email === '') {
      email = `${username}@student.lu.se`;
    }

    const createdUser = await prisma.prismaUser.create({
      data: {
        ...inputReduced,
        username,
        email,
        passwordHash,
        passwordSalt,
      },
    });

    const logStr = `Created user ${Logger.pretty(inputReduced)}`;
    logger.info(logStr);

    return createdUser;
  }

  async updateUser(username: string, partial: Partial<PrismaUser>): Promise<PrismaUser> {
    if (partial.username) {
      throw new BadRequestError('Användarnamn kan inte uppdateras');
    }

    const res = await prisma.prismaUser.update({
      where: {
        username,
      },
      data: partial,
    });

    return res;
  }

  async requestPasswordReset(username: string): Promise<string> {
    const token = crypto.randomBytes(24).toString('hex');

    const res = await prisma.prismaPasswordReset.create({
      data: {
        token,
        refUser: username,
      },
    });

    // If no row was inserted into the DB
    if (!res) {
      throw new ServerError('Något gick fel');
    }

    await prisma.prismaPasswordReset.deleteMany({
      where: {
        refUser: username,
        AND: {
          NOT: {
            token,
          },
        },
      },
    });

    return token;
  }

  async validateResetPasswordToken(username: string, token: string): Promise<boolean> {
    const row = await prisma.prismaPasswordReset.findFirst({
      where: {
        refUser: username,
        AND: {
          token,
        },
      },
    });

    return this.validateResetPasswordRow(row);
  }

  async resetPassword(token: string, username: string, password: string): Promise<void> {
    const row = await prisma.prismaPasswordReset.findFirst({
      where: {
        refUser: username,
        AND: {
          token,
        },
      },
    });

    // If no entry or token expired
    if (!this.validateResetPasswordRow(row)) {
      throw new NotFoundError('Denna förfrågan finns inte eller har gått ut');
    }

    const passwordData = this.generateSaltAndHash(password);

    await this.updateUser(username, { ...passwordData });

    // Delete row in password table
    await prisma.prismaPasswordReset.delete({
      where: {
        token,
      },
    });
  }

  private validateResetPasswordRow(row: PrismaPasswordReset | null): boolean {
    if (!row) {
      return false;
    }

    const EXPIRE_MINUTES = 60; // 1h

    const expirationTime = Date.now() - row.time.getTime();

    return expirationTime < EXPIRE_MINUTES * 60 * 1000;
  }

  private generateSaltAndHash(password: string): { passwordSalt: string; passwordHash: string } {
    const passwordSalt = crypto.randomBytes(16).toString('base64');
    const passwordHash = this.hashPassword(password, passwordSalt);

    return { passwordSalt, passwordHash };
  }

  async deleteUser(username: string): Promise<boolean> {
    const res1 = await prisma.prismaPasswordReset.deleteMany({
      where: {
        refUser: username,
      },
    });

    const res = await prisma.prismaUser.delete({
      where: {
        username,
      },
    });

    return res != null && res1 != null;
  }
}
