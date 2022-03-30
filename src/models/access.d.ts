import type { PrismaResourceType } from '@prisma/client';

export type AccessEntry = {
  resource: string;
  resourceType: PrismaResourceType;
};