import EmergencyContactAPI from '@api/emergencycontact';
import type { Resolvers } from '@generated/graphql';
import { checkUserFieldAccess } from './user.resolver';

const ecApi = new EmergencyContactAPI();

const emergencycontactresolver: Resolvers = {
  Mutation: {
    addEmergencyContact: async (_, { name, phone, type }, { getUsername }) => {
      const username = getUsername();

      const added = await ecApi.addEmergencyContact(username, name, phone, type);
      return added;
    },
    removeEmergencyContact: async (_, { id }, { getUsername }) => {
      const username = getUsername();
      const removed = await ecApi.removeEmergencyContact(username, id);
      return removed;
    },
  },
  User: {
    emergencyContacts: async (user, _, ctx) => {
      checkUserFieldAccess(ctx, user);
      const contacts = await ecApi.getEmergencyContacts(user.username);
      return contacts;
    }
  }
};

export default emergencycontactresolver;
