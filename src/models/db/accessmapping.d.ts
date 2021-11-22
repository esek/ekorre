import { ResolverType } from '../../graphql.generated';

export type DatabaseAccessMapping = {
  id: number;
  refaccessresource: string;
  resolverType: ResolverType;
  resolverName: string;
};
