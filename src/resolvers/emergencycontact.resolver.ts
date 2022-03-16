import { reduce } from '@/reducers';
import EmergencyContactAPI from '@api/emergencycontact';
import type { Resolvers } from '@generated/graphql';
import { emergencyContactReducer } from '@reducer/emergencycontact';

const ecApi = new EmergencyContactAPI();

const emergencycontactresolver: Resolvers = {
  Query: {
    emergencyContacts: async (_, { username }) => {
      const contacts = await ecApi.getEmergencyContacts(username);
      return reduce(contacts, emergencyContactReducer);
    },
  },
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
};

export default emergencycontactresolver;
