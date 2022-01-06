import { ServerError } from '../errors/RequestErrors';
import { EmergencyContactType } from '../graphql.generated';
import { Logger } from '../logger';
import { DatabaseEmergencyContact } from '../models/db/emergencycontact';
import { EMERGENCY_CONTACTS_TABLE } from './constants';
import knexInstance from './knex';

const logger = Logger.getLogger('EmergencyContactApi');

class EmergencyContactAPI {
  async getEmergencyContacts(username: string): Promise<DatabaseEmergencyContact[]> {
    const contacts = await knexInstance<DatabaseEmergencyContact>(EMERGENCY_CONTACTS_TABLE).where(
      'refuser',
      username,
    );

    return contacts;
  }

  async addEmergencyContact(
    username: string,
    name: string,
    phone: string,
    type: EmergencyContactType,
  ): Promise<boolean> {
    try {
      await knexInstance<DatabaseEmergencyContact>(EMERGENCY_CONTACTS_TABLE).insert({
        name,
        phone,
        type,
        refuser: username,
      });

      return true;
    } catch (err) {
      logger.error(`Emergency contact could not be created: ${JSON.stringify(err)}`);
      throw new ServerError('Kunde inte lägga till nödkontakt');
    }
  }

  async removeEmergencyContact(username: string, id: number): Promise<boolean> {
    const removed = await knexInstance<DatabaseEmergencyContact>(EMERGENCY_CONTACTS_TABLE)
      .where({ refuser: username, id })
      .delete();

    if (removed < 1) {
      throw new ServerError('Kunde inte ta bort nödkontakten');
    }

    return true;
  }
}

export default EmergencyContactAPI;
