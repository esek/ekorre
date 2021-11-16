import AccessResourcesAPI from '../api/accessresources.api';
import { Resolvers } from '../graphql.generated';

const resourcesAPI = new AccessResourcesAPI();

const doorResolver: Resolvers = {
  Query: {
    accessResource: async (_, { slug }) => resourcesAPI.getResource(slug),
    accessResources: async (_, { type }) => {
      const safeType = type ?? undefined;
      const resources = await resourcesAPI.getResources(safeType);

      return resources;
    },
  },
  Mutation: {
    addAccessResource: async (_, { name, description, resourceType }) =>
      resourcesAPI.addResource(name, description, resourceType),
    removeAccessResource: async (_, { slug }) => resourcesAPI.removeResouce(slug),
  },
};

export default doorResolver;
