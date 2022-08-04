import { reduce } from '@/reducers';
import EmergencyContactAPI from '@api/emergencycontact';
import { Resolvers } from '@generated/graphql';
import { emergencyContactReducer } from '@reducer/emergencycontact';

import { checkUserFieldAccess } from './user.resolver';

const ecApi = new EmergencyContactAPI();

const emergencycontactresolver: Resolvers = {
  Mutation: {
    addEmergencyContact: async (_, { name, phone, type }, { getUsername }) => {
      const username = getUsername();

      // TODO: Pga GDPR får vi tyvärr inte ha detta längre
      // if (type === EmergencyContactType.Sister) {
      //   sendEmail(
      //     'mr.emil101@gmail.com',
      //     'Ny syrra i din närhet!',
      //     '',
      //     {},
      //     `
      //     <h1>Ny syrra i din närhet!</h1>
      //     <p>${username} har lagt till en ny syrra i sin närhet.</p>
      //     <p>Namn: ${name}</p>
      //     <p>Telefon: ${phone}</p>
      //   `,
      //   );
      // }

      const added = await ecApi.addEmergencyContact(username, name, phone, type);
      return reduce(added, emergencyContactReducer);
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
      return reduce(contacts, emergencyContactReducer);
    },
  },
};

export default emergencycontactresolver;
