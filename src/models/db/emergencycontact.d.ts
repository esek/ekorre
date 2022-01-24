import { EmergencyContact } from '@generated/graphql';

export type DatabaseEmergencyContact = EmergencyContact & {
  refuser: string;
};
