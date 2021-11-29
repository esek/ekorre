import { BadRequestError, ServerError } from '../errors/RequestErrors';
import { EmergencyContactType } from '../graphql.generated';
import { DatabaseEmergencyContact } from '../models/db/emergencycontact';
import { validateNonEmptyArray } from '../services/validation.service';
import { EMERGENCY_CONTACTS_TABLE } from './constants';
import knex from './knex';

class EmergencyContactAPI {
  async getEmergencyContacts(username: string): Promise<DatabaseEmergencyContact[]> {
    const contacts = await knex<DatabaseEmergencyContact>(EMERGENCY_CONTACTS_TABLE).where(
      'refuser',
      username,
    );

    validateNonEmptyArray(contacts, 'Inga nödkontakter hittades');

    return contacts;
  }

  async addEmergencyContact(
    username: string,
    name: string,
    phone: string,
    type: EmergencyContactType,
  ): Promise<boolean> {
    // regex for swedish telephone numbers
    const r = new RegExp(/^(\+46|0)7\d{8}$/);

    if (!r.test(phone)) {
      throw new BadRequestError('Felaktigt telefonnummer');
    }

    const removed = await knex<DatabaseEmergencyContact>(EMERGENCY_CONTACTS_TABLE).insert({
      name,
      phone,
      type,
      refuser: username,
    });

    if (removed[0] < 1) {
      throw new ServerError('Kunde inte lägga till nödkontakten');
    }

    return true;
  }

  async removeEmergencyContact(username: string, id: number): Promise<boolean> {
    const removed = await knex<DatabaseEmergencyContact>(EMERGENCY_CONTACTS_TABLE)
      .where({ refuser: username, id })
      .delete();

    if (removed < 1) {
      throw new ServerError('Kunde inte ta bort nödkontakten');
    }

    return true;
  }
}

export default EmergencyContactAPI;
