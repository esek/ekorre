import { PrismaIndividualAccess, PrismaPostAccess, PrismaResourceType } from '@prisma/client';

export const individualAccess: PrismaIndividualAccess[] = [
  {
    id: 1,
    refUser: 'aa0000bb-s',
    resource: 'superadmin',
    resourceType: PrismaResourceType.feature,
  },
];

export const postAccess: PrismaPostAccess[] = [
  {
    id: 1,
    refPost: 1,
    resource: 'superadmin',
    resourceType: PrismaResourceType.feature,
  },
];
