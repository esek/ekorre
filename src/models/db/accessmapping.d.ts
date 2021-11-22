import { ResolverType } from '../../graphql.generated';

export type DatabaseAccessMapping = {
  id: number;
  refresource: string;
  resolverType: ResolverType;
  resolverName: string;
};
