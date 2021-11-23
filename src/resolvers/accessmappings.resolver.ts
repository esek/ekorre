import * as resolverObjects from '.';

import { AccessAPI } from '../api/access.api';
import {
  AccessMapping,
  AvailableResolver,
  MutationResolvers,
  QueryResolvers,
  Resolvers,
  ResolverType,
} from '../graphql.generated';
import { AccessResourceResponse } from '../models/mappers';

const accessApi = new AccessAPI();

type TempAccessMapping = Omit<AccessMapping, 'resources'> & {
  resources: AccessResourceResponse[];
};

type TempMappingObject = Record<string, TempAccessMapping>;

const accessMappingResolver: Resolvers = {
  Query: {
    resolvers: (_, { type }) => {
      const resolversToReturn: AvailableResolver[] = [];

      // Converts the resolver object to an array of the names and their types
      const hydrate = (
        resolverType: ResolverType,
        resolver?: QueryResolvers | MutationResolvers,
      ) => {
        if (!resolver) {
          return [];
        }

        const keys: AvailableResolver[] = Object.keys(resolver).map((name) => ({
          name,
          type: resolverType,
        }));

        return keys;
      };

      // Add the resolvers to their arrays
      Object.values(resolverObjects).forEach((resolver) => {
        if (type === ResolverType.Query || !type) {
          resolversToReturn.push(...hydrate(ResolverType.Query, resolver.Query));
        }

        if (type === ResolverType.Mutation || !type) {
          resolversToReturn.push(...hydrate(ResolverType.Mutation, resolver.Mutation));
        }
      });

      return resolversToReturn;
    },
    accessMappings: async (_, { type, name }) => {
      const mappings = await accessApi.getAccessMapping(name ?? undefined, type ?? undefined);

      // eslint-disable-next-line @typescript-eslint/indent
      const obj: TempMappingObject = {};

      mappings.forEach((mapping) => {
        const { resolverName } = mapping;

        if (!(resolverName in obj)) {
          obj[resolverName] = {
            id: mapping.id,
            resolver: {
              name: resolverName,
              type: mapping.resolverType,
            },
            resources: [],
          };
        }

        obj[resolverName].resources.push({
          slug: mapping.refaccessresource,
        });
      });

      return Object.values(obj);
    },
  },
  Mutation: {
    addResolverMappings: async (_, { name, type, slugs }) =>
      accessApi.addAccessMappings(name, type, slugs),
    removeResolverMappings: async (_, { name, type, slugs }) =>
      accessApi.removeAccessMapping(name, type, slugs ?? undefined),
  },
};

export default accessMappingResolver;
