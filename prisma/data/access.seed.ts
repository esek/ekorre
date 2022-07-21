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

export const apiKeys: Prisma.PrismaApiKeyUncheckedCreateInput[] = [
  {
    refCreator: 'aa0000bb-s',
    description: 'Seeding api key (dont remove pls)',
    key: 'af0bba60-6efc-4026-a484-f212ce4a5843',
  },
];

export const apiKeyAccess: Prisma.PrismaApiKeyAccessUncheckedCreateInput[] = [
  {
    refApiKey: apiKeys[0].key,
    resource: 'superadmin',
    resourceType: PrismaResourceType.feature,
  },
];
