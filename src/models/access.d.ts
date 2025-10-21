import type { PrismaResourceType } from '@prisma/client';

export type AccessEntry = {
  resource: string;
  resourceType: PrismaResourceType;
};

export type AccessEndDateEntry = {
  resource: string;
  resourceType: PrismaResourceType;
  endDate: Date | null;
}

export type AccessLogEntry<T = number | string> = {
  refGrantor: string;
  refTarget: T;
  resourceType: PrismaResourceType;
  resource: string;
  isActive: boolean;
};
