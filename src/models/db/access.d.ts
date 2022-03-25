import type { AccessResourceType } from '@generated/graphql';

export type DatabaseAccess = {
  refname: string;
  resourcetype: AccessResourceType;
  resource: string;
};
