import type { PrismaResourceType } from '@prisma/client';

export type AccessEntry = {
  resource: string;
  resourceType: PrismaResourceType;
};

export type AccessLogEntry<T = number | string> = {
  refGrantor: string;
  refTarget: T;
  resourceType: PrismaResourceType;
  resource: string;
  isActive: boolean;
};
