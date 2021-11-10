import { AccessResourceType } from '../../graphql.generated';

export type DatabaseAccessResource = {
  id: number;
  name: string;
  description: string;
  resourceType: AccessResourceType;
};
