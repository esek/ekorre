import { AccessResourceType } from '@generated/graphql';

export type DatabaseAccessResource = {
  slug: string;
  name: string;
  description: string;
  resourceType: AccessResourceType;
};
