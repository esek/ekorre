import { ResolverType } from '@generated/graphql';

export type DatabaseAccessMapping = {
  id: number;
  refaccessresource: string;
  resolverType: ResolverType;
  resolverName: string;
};
