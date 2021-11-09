import { ResourceType } from '../../graphql.generated';

export type DatabaseResource = {
  id: number;
  name: string;
  description: string;
  resourceType: ResourceType;
};
