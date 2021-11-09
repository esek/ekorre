import AccessResourcesAPI from '../api/accessresources.api';
import { Resolvers } from '../graphql.generated';

const resourcesAPI = new AccessResourcesAPI();

const doorResolver: Resolvers = {
  Query: {
    accessResource: async (_, { id }) => resourcesAPI.getResource(id),
    accessResources: async (_, { type }) => {
      const safeType = type ?? undefined;
      const resources = await resourcesAPI.getResources(safeType);

      return resources;
    },
  },
  Mutation: {
    addAccessResource: async (_, { name, description, resourceType }) => {
      const door = await resourcesAPI.addResource(name, description, resourceType);
      return door;
    },
    removeAccessResource: async (_, { id }) => resourcesAPI.removeResouce(id),
  },
};

export default doorResolver;
