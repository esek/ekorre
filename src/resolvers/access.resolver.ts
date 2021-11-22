import * as resolverObjects from '.';

import { AccessAPI } from '../api/access.api';
import { PostAPI } from '../api/post.api';
import {
  AccessMapping,
  AvailableResolver,
  MutationResolvers,
  QueryResolvers,
  Resolvers,
  ResolverType,
} from '../graphql.generated';
import { AccessResourceResponse } from '../models/mappers';
import { accessReducer } from '../reducers/access.reducer';

const accessApi = new AccessAPI();
const postApi = new PostAPI();

const accessresolver: Resolvers = {
  Query: {
    individualAccess: async (_, { username }) => {
      const access = await accessApi.getIndividualAccess(username);

      return accessReducer(access);
    },
    postAccess: async (_, { postname }) => {
      const access = await accessApi.getPostAccess(postname);

      return accessReducer(access);
    },
    resolvers: async (_, { type }) => {
      const queries: AvailableResolver[] = [];
      const mutations: AvailableResolver[] = [];

      // Converts the resolver object to an array of the names and their types
      const hydrate = (type: ResolverType, resolver?: QueryResolvers | MutationResolvers) => {
        if (!resolver) {
          return [];
        }

        const keys: AvailableResolver[] = Object.keys(resolver).map((name) => ({
          name,
          type,
        }));

        return keys;
      };

      // Add the resolvers to their arrays
      Object.values(resolverObjects).forEach((resolver) => {
        queries.push(...hydrate(ResolverType.Query, resolver.Query));
        mutations.push(...hydrate(ResolverType.Mutation, resolver.Query));
      });

      // Only return the ones that are relevant
      switch (type) {
        case ResolverType.Query:
          return queries;
        case ResolverType.Mutation:
          return mutations;
        default:
          return [...queries, ...mutations];
      }
    },
    accessMappings: async (_, { type, name }) => {
      const mappings = await accessApi.getAccessMapping(name ?? undefined, type ?? undefined);
      const obj: Record<
        string,
        Omit<AccessMapping, 'resources'> & {
          resources: AccessResourceResponse[];
        }
      > = {};

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
          slug: mapping.refresource,
        });
      });

      return Object.values(obj);
    },
  },
  Mutation: {
    setIndividualAccess: (_, { username, access }) =>
      accessApi.setIndividualAccess(username, access),
    setPostAccess: (_, { postname, access }) => accessApi.setPostAccess(postname, access),
  },
  User: {
    access: async ({ username }) => {
      const indAccess = await accessApi.getIndividualAccess(username);
      const posts = await postApi.getPostsForUser(username);
      const postNames = posts.map((e) => e.postname);
      const postAccess = await accessApi.getAccessForPosts(postNames);

      return accessReducer([...indAccess, ...postAccess]);
    },
  },
  Post: {
    access: async ({ postname }) => {
      // Maybe implement API method that takes single postname.
      const postAccess = await accessApi.getAccessForPosts([postname]);
      return accessReducer(postAccess);
    },
  },
};

export default accessresolver;
