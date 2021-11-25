import { AccessResourceType } from '../../graphql.generated';

export type DatabaseAccessResource = {
  slug: string;
  name: string;
  description: string;
  resourceType: AccessResourceType;
};
