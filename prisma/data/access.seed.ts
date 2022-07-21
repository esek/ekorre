import { Prisma, PrismaResourceType } from '@prisma/client';

export const individualAccess: Prisma.PrismaIndividualAccessUncheckedCreateInput[] = [
  {
    refUser: 'aa0000bb-s',
    resource: 'superadmin',
    resourceType: PrismaResourceType.feature,
  },
];

export const postAccess: Prisma.PrismaPostAccessUncheckedCreateInput[] = [
  {
    refPost: 1,
    resource: 'superadmin',
    resourceType: PrismaResourceType.feature,
  },
];
