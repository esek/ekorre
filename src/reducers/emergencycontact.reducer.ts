import { EmergencyContact, EmergencyContactType } from '@generated/graphql';
import { PrismaEmergencyContact } from '@prisma/client';

export const emergencyContactReducer = (ec: PrismaEmergencyContact): EmergencyContact => {
  return {
    ...ec,
    type: ec.type as EmergencyContactType,
  };
};
