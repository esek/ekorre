import { ServerError } from '@/errors/request.errors';
import { Logger } from '@/logger';
import type { EmergencyContactType } from '@generated/graphql';
import type { PrismaEmergencyContact } from '@prisma/client';

import prisma from './prisma';

const logger = Logger.getLogger('EmergencyContactApi');

class EmergencyContactAPI {
  async getEmergencyContacts(username: string): Promise<PrismaEmergencyContact[]> {
    const contacts = await prisma.prismaEmergencyContact.findMany({
      where: {
        refUser: username,
      },
    });

    return contacts;
  }

  /**
   * Adds a new emergency contact for a user, returning
   * the created contact ID if successfull
   * @param username Username of user with this contact
   * @param name Name of the contact
   * @param phone Phone number of the contact
   * @param type Type of emergency contact
   * @throws {ServerError} If the contact could not be added
   * @returns ID of the newly created emergency contact
   */
  async addEmergencyContact(
    username: string,
    name: string,
    phone: string,
    type: EmergencyContactType,
  ): Promise<number> {
    try {
      const { id } = await prisma.prismaEmergencyContact.create({
        data: { name, phone, type, refUser: username },
      });

      return id;
    } catch (err) {
      logger.error(`Emergency contact could not be created: ${JSON.stringify(err)}`);
      throw new ServerError('Kunde inte lägga till nödkontakt');
    }
  }

  async removeEmergencyContact(username: string, id: number): Promise<boolean> {
    try {
      await prisma.prismaEmergencyContact.delete({
        where: {
          id_refUser: {
            id,
            refUser: username,
          },
        },
      });

      return true;
    } catch {
      throw new ServerError('Kunde inte ta bort nödkontakten');
    }
  }
}

export default EmergencyContactAPI;
