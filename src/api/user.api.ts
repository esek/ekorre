/* eslint-disable class-methods-use-this */
import { Logger } from '@/logger';
import { devGuard } from '@/util';
import { LoginProvider } from '@esek/auth-server';
import type { NewUser } from '@generated/graphql';
import { Prisma, PrismaLoginProvider, PrismaPasswordReset, PrismaUser } from '@prisma/client';
import { verify } from '@service/verify';
import crypto, { randomUUID } from 'crypto';

import {
  BadRequestError,
  NotFoundError,
  ServerError,
  UnauthenticatedError,
} from '../errors/request.errors';
import prisma from './prisma';

type UserWithAccess = Prisma.PrismaUserGetPayload<{
  include: {
    access: true;
  };
}>;

const logger = Logger.getLogger('UserAPI');
const defaultOrder: Prisma.PrismaUserOrderByWithRelationInput[] = [
  {
    firstName: 'asc',
  },
  {
    lastName: 'asc',
  },
  {
    class: 'desc',
  },
];

export class UserAPI {
  /**
   * Verifies if the given password is correct
   * @param input The password
   * @param hash The stored hash
   * @param salt The stored salt
   */
  private verifyPassword(input: string, hash: string, salt: string): boolean {
    const equal = hash === this.hashPassword(input, salt);
    return equal;
  }

  /**
   * Hashes a password with the given salt
   * @param password The password to hash
   * @param salt A randomly generated salt
   */
  private hashPassword(password: string, salt: string): string {
    const hash = crypto.pbkdf2Sync(password, Buffer.from(salt, 'base64'), 1000, 64, 'sha512');
    const hashstr = hash.toString('base64');
    return hashstr;
  }

  /**
   * Retrieves all stored users, ordered by first name, last name, and finally class
   */
  async getAllUsers(): Promise<PrismaUser[]> {
    const users = await prisma.prismaUser.findMany({
      orderBy: defaultOrder,
    });
    return users;
  }

  /**
   * Retrieves a user
   * @param username Username for the user
   * @throws {NotFoundError} If the user is not found
   */
  async getSingleUser(username: string): Promise<PrismaUser> {
    const u = await prisma.prismaUser.findFirst({
      where: {
        username: username.toLowerCase(),
      },
    });

    if (u == null) {
      throw new NotFoundError('Användaren kunde inte hittas');
    }

    return u;
  }

  /**
   * Retrieves a user
   * @param luCard LU Card number in decimal for the user
   * @throws {NotFoundError} If the user is not found
   */
  async getSingleUserByLuCard(luCard: string): Promise<PrismaUser> {
    const u = await prisma.prismaUser.findFirst({
      where: {
        luCard: luCard,
      },
    });

    if (u == null) {
      throw new NotFoundError('Användaren kunde inte hittas');
    }

    return u;
  }

  /**
   * Retrieves multiple users ordered after first name, then last name, and finally class
   * @param usernames Usernames to the users to be received
   */
  async getMultipleUsers(usernames: string[]): Promise<PrismaUser[]> {
    const u = await prisma.prismaUser.findMany({
      where: {
        username: {
          in: usernames.map((un) => un.toLowerCase()),
        },
      },
      orderBy: defaultOrder,
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
    const searchArray = search
      .toLowerCase()
      .split(/\s+/g)
      .map((s) => `%${s}%`);
    const users = await prisma.$queryRaw`
      SELECT username, password_hash AS "passwordHash", password_salt AS "passwordSalt",
      first_name AS "firstName", last_name AS "lastName", class, photo_url AS "photoUrl",
      email, phone, address, zip_code AS "zipCode", website, date_joined AS "dateJoined"
      FROM users
      WHERE lower(concat(first_name, last_name, username))
      LIKE ${Prisma.join(searchArray, ' AND lower(concat(first_name, last_name, username)) LIKE ')}
      ORDER BY first_name ASC, last_name ASC, class DESC
    `;

    return users as PrismaUser[];
  }

  /**
   * Retrieves the total number of members registered,
   * and optionally if they are considered active (class number is equal
   * to or less than five years ago)
   * @param noAlumni If people whose class are more than five years away are to be ignored
   * @returns The total number of registered users
   * @throws {ServerError} If we have gone back in time or the creator of this code is dead (statistically)
   */
  async getNumberOfMembers(noAlumni = false): Promise<number> {
    if (noAlumni) {
      // Registration date won't work since migration didn't migrate that,
      // so if you're reading this after 2027 you can probably just go by that

      // End-of-my-lifetime check
      const currentYear = new Date().getFullYear();
      if (currentYear > 2099) {
        // Throw error if the person that wrote this code has probably died and the code should be fixed
        throw new ServerError(
          'Den som skrev denna koden är nu statistiskt sett död och koden borde fixas',
        );
      }

      // We don't support 2004 we're past that
      if (currentYear < 2005) {
        throw new ServerError('Denna kod stödjer ej tidsresenärer');
      }

      // Only want two numbers lol
      const lastDigits = currentYear - 2000;

      const validEndings = [];
      for (let i = 0; i < 5; i -= -1) {
        validEndings.push({
          class: {
            endsWith: String(lastDigits - i),
          },
        });
      }

      const count = await prisma.prismaUser.count({
        where: {
          OR: validEndings,
        },
      });

      return count;
    } else {
      const count = await prisma.prismaUser.count();

      return count;
    }
  }
  /**
   *
   * @returns All users with individual access
   */
  async getUsersWithIndividualAccess(): Promise<UserWithAccess[]> {
    const users = await prisma.prismaUser.findMany({
      //filters out users with empty access
      where: {
        access: {
          some: {},
        },
      },
      include: {
        access: true,
      },
    });
    return users;
  }

  /**
   * Ensures a login is correct, and if so returns the user
   * @param username Username for the user
   * @param password Password in plaintext
   */
  async loginUser(username: string, password: string): Promise<PrismaUser> {
    const user = await prisma.prismaUser.findFirst({
      where: {
        username: username.toLowerCase(),
      },
    });

    if (user == null) {
      throw new NotFoundError('Användaren finns inte');
    }

    if (!this.verifyPassword(password, user.passwordHash, user.passwordSalt)) {
      throw new UnauthenticatedError('Inloggningen misslyckades');
    }

    return user;
  }

  /**
   * Change password for a user
   * @param username Username for the user
   * @param oldPassword The old password in plaintext
   * @param newPassword The new password in plaintext
   */
  async changePassword(
    username: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const lowerUsername = username.toLowerCase();
    const user = await prisma.prismaUser.findFirst({
      where: {
        username: lowerUsername,
      },
    });

    if (user == null) {
      throw new NotFoundError('Användaren finns inte');
    }

    if (!this.verifyPassword(oldPassword, user.passwordHash, user.passwordSalt)) {
      throw new UnauthenticatedError('Ditt gamla lösenord är fel');
    }

    const updated = await prisma.prismaUser.update({
      where: {
        username: lowerUsername,
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
   * Creates a new user
   * @param input The user to be created
   */
  async createUser(input: NewUser): Promise<PrismaUser> {
    const { password, ...inputReduced } = input;

    if (password === '') {
      throw new BadRequestError('Ogiltigt lösenord');
    }

    const { passwordSalt, passwordHash } = this.generateSaltAndHash(password);

    const { username } = input;

    // No empty usernames
    if (username === '') {
      throw new BadRequestError('Ogiltigt användarnamn');
    }

    const lowerUsername = username.toLowerCase();

    // We cannot be sure what email is
    let { email } = input;

    if (!email || email === '') {
      email = `${lowerUsername}@student.lu.se`;
    }

    const createdUser = await prisma.prismaUser.create({
      data: {
        ...inputReduced,
        username: lowerUsername,
        email: email.toLowerCase(),
        passwordHash,
        passwordSalt,
      },
    });

    const logStr = `Created user ${Logger.pretty(inputReduced)}`;
    logger.info(logStr);

    return createdUser;
  }

  validLuCard(luCard: string): boolean {
    // Based on findings about LU cards the first six digits are the same
    // for all cards and the last ten are the card serial
    // https://github.com/esek/ekorre/pull/240#issuecomment-1250354632
    const LU_CARD_START = '002504';
    const startCorrect = luCard.startsWith(LU_CARD_START);
    const hasCorrectLength = luCard.length === 16;
    const hasOnlyNumbers = /^[0-9]+$/.test(luCard);

    return startCorrect && hasCorrectLength && hasOnlyNumbers;
  }

  /**
   * Update a user
   * @param username Username of the user to be updated
   * @param partial Database representation of how the user is to be
   * @returns The modified user
   * @throws {BadRequestError} If the username is attempted to be changed
   */
  async updateUser(username: string, partial: Partial<PrismaUser>): Promise<PrismaUser> {
    if (partial.username) {
      throw new BadRequestError('Användarnamn kan inte uppdateras');
    }

    // If we are trying to set the LU card to an empty string, set it to null
    // we can't have empty strings in the database because if unique constraints
    if (partial.luCard === '') {
      partial.luCard = null;
    }

    // check if we are trying to update the LU card, and that it's not an empty string or null
    if ('luCard' in partial && partial.luCard && !this.validLuCard(partial.luCard)) {
      throw new BadRequestError('Ogiltigt LU-kort');
    }

    const res = await prisma.prismaUser.update({
      where: {
        username: username.toLowerCase(),
      },
      data: partial,
    });

    return res;
  }

  /**
   * Creates a password reset token for a user, and deletes all old ones
   * @param username Username of the user wishing to change their password
   * @returns The created password token
   */
  async requestPasswordReset(username: string): Promise<string> {
    const token = crypto.randomBytes(24).toString('hex');
    const lowerUsername = username.toLowerCase();

    const deleteOldTokens = prisma.prismaPasswordReset.deleteMany({
      where: {
        refUser: lowerUsername,
      },
    });

    const createNewToken = prisma.prismaPasswordReset.create({
      data: {
        token,
        refUser: lowerUsername,
      },
    });

    await prisma.$transaction([deleteOldTokens, createNewToken]);
    return token;
  }

  /**
   * Validates a password reset token for a user
   * @param username Username of the user
   * @param token Password reset token
   */
  async validateResetPasswordToken(username: string, token: string): Promise<boolean> {
    const row = await prisma.prismaPasswordReset.findFirst({
      where: {
        refUser: username.toLowerCase(),
        AND: {
          token,
        },
      },
    });

    return this.validateResetPasswordRow(row);
  }

  /**
   * Resets the password for a user, if the provided token is valid
   * @param token Password reset token
   * @param username Username of the user
   * @param password New password as plaintext
   */
  async resetPassword(token: string, username: string, password: string): Promise<void> {
    // This is a costly operation, do outside transaction
    const passwordData = this.generateSaltAndHash(password);

    // We want all of this as an atomic operation, and rollback everything
    // if it fails
    await prisma.$transaction(async () => {
      const row = await prisma.prismaPasswordReset.findFirst({
        where: {
          refUser: username.toLowerCase(),
          AND: {
            token,
          },
        },
      });

      // If no entry or token expired
      if (!this.validateResetPasswordRow(row)) {
        throw new NotFoundError('Denna förfrågan finns inte eller har gått ut');
      }

      await this.updateUser(username, { ...passwordData });

      // Delete row in password table
      await prisma.prismaPasswordReset.delete({
        where: {
          token,
        },
      });
    });
  }

  /**
   * Validates a reset password row in regards to time
   * @param row A prisma password reset row
   * @returns If the row is valid
   */
  private validateResetPasswordRow(row: PrismaPasswordReset | null): boolean {
    if (!row) {
      return false;
    }

    const EXPIRE_MINUTES = 60; // 1h

    const expirationTime = Date.now() - row.time.getTime();

    return expirationTime < EXPIRE_MINUTES * 60 * 1000;
  }

  /**
   * Generates salt and hash for a password
   * @param password Password as plaintext
   */
  private generateSaltAndHash(password: string): { passwordSalt: string; passwordHash: string } {
    const passwordSalt = crypto.randomBytes(16).toString('base64');
    const passwordHash = this.hashPassword(password, passwordSalt);

    return { passwordSalt, passwordHash };
  }

  /**
   * Removes all info about a user, that is not needed for the API to work
   * @param username Username for the user to be anonymized
   */
  async forgetUser(username: string): Promise<boolean> {
    const lowerUsername = username.toLowerCase();

    const anonymizeUser = prisma.prismaUser.update({
      where: {
        username: lowerUsername,
      },
      data: {
        passwordHash: randomUUID(),
        passwordSalt: randomUUID(),
        firstName: 'Raderad',
        lastName: 'Användare',
        class: 'EXX',
        email: '',
        phone: '',
        address: '',
        zipCode: '',
      },
    });

    const deleteEmergencyContacts = prisma.prismaEmergencyContact.deleteMany({
      where: {
        refUser: lowerUsername,
      },
    });

    const deletePasswordResets = prisma.prismaPasswordReset.deleteMany({
      where: {
        refUser: lowerUsername,
      },
    });

    const [res, res1, res2] = await prisma.$transaction([
      anonymizeUser,
      deleteEmergencyContacts,
      deletePasswordResets,
    ]);

    return res != null && res1 != null && res2 != null;
  }

  /**
   * Completely deletes a user. Cannot be used in production, `forgetUser` should
   * be used instead
   * @param username Username of the user to be deleted
   * @returns If the user was deleted
   */
  async deleteUser(username: string): Promise<boolean> {
    devGuard('Användare kan inte tas bort i produktion, de borde glömmas istället');

    const lowerUsername = username.toLowerCase();

    const res = await prisma.prismaUser.delete({
      where: {
        username: lowerUsername,
      },
    });

    return res != null;
  }

  /**
   * Links a login provider (like LU, GitLab, Discord etc.) to a user
   * @param username Username of the user to be linked
   * @param provider Which provider to be linked
   * @param token Provider token
   * @param email Case-insensitive E-mail at the login provider (like different Google accounts)
   */
  async linkLoginProvider(
    username: string,
    provider: LoginProvider,
    token: string,
    email?: string,
  ): Promise<PrismaLoginProvider> {
    const created = await prisma.prismaLoginProvider.create({
      data: {
        provider,
        token,
        email: email?.toLowerCase(),
        refUser: username.toLowerCase(),
      },
    });
    return created;
  }

  /**
   * Unlinks a login provider for a user
   * @param id ID of the login provider
   * @param username Username of the user to be unlinked
   */
  async unlinkLoginProvider(id: number, username: string): Promise<boolean> {
    const res = await prisma.prismaLoginProvider.deleteMany({
      where: {
        id: id,
        refUser: username.toLowerCase(),
      },
    });

    return res.count > 0;
  }

  /**
   * Retrieves the user with this token for this login provider,
   * and optionally email (case-insensitive) if one exists
   * @param token Provider token
   * @param provider Which provider to be linked
   * @param email Case-insensitive E-mail at the login provider (like different Google accounts)
   */
  async getUserFromProvider(token: string, provider: string, email?: string): Promise<PrismaUser> {
    const AND: Prisma.Enumerable<Prisma.PrismaLoginProviderWhereInput> = [
      {
        token,
      },
      {
        provider,
      },
    ];

    if (email) {
      AND.push({
        email: email.toLowerCase(),
      });
    }

    const response = await prisma.prismaLoginProvider.findFirst({
      where: {
        AND,
      },
      select: {
        user: true,
      },
    });

    if (!response) {
      throw new NotFoundError('Denna användaren finns inte');
    }

    return response.user;
  }

  /**
   * Retrieves login providers for a user baser on provider enum, ordered by
   * name of provider
   * @param username Username of the user
   * @param provider Provider name
   */
  async getLoginProviders(username: string, provider?: string): Promise<PrismaLoginProvider[]> {
    const where: Record<string, string> = { refUser: username };

    if (provider) {
      where.provider = provider;
    }

    const providers = await prisma.prismaLoginProvider.findMany({
      where,
      orderBy: {
        provider: 'asc',
      },
    });

    return providers;
  }

  async isUserVerified(username: string): Promise<boolean> {
    const res = await prisma.prismaVerifyInfo.findUnique({ where: { refUser: username } });

    //If never verified
    if (!res) {
      return false;
    }

    if (res.verifiedUntil.getTime() < Date.now()) {
      return false;
    }

    return true;
  }

  async verifyUser(username: string, ssn: string): Promise<boolean> {
    const userVerified = await this.isUserVerified(username);

    const success = await verify(ssn, userVerified);

    if (!success) {
      throw new ServerError('Kudne inte verifiera användaren');
    }

    //13th of july in the coming year maybe good yes?
    const verifiedUntil = new Date(new Date().getFullYear() + 1, 6, 13).toISOString();

    const res = await prisma.prismaVerifyInfo.upsert({
      where: { refUser: username },
      create: { refUser: username, verifiedUntil: verifiedUntil },
      update: { verifiedUntil: verifiedUntil },
    });

    return res != null;
  }
}
