import { EmergencyContact } from '../../graphql.generated';

export type DatabaseEmergencyContact = EmergencyContact & {
  refuser: string;
};
