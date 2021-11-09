import ResourcesAPI from '../api/resources.api';
import { Resolvers } from '../graphql.generated';

const resourcesAPI = new ResourcesAPI();

const doorResolver: Resolvers = {
  Query: {
    resource: async (_, { id }) => resourcesAPI.getResource(id),
    resources: async (_, { type }) => {
      const safeType = type ?? undefined;
      const resources = await resourcesAPI.getResources(safeType);

      return resources;
    },
  },
  Mutation: {
    addResource: async (_, { name, description, resourceType }) => {
      const door = await resourcesAPI.addResource(name, description, resourceType);
      return door;
    },
    removeResource: async (_, { id }) => resourcesAPI.removeResouce(id),
  },
};

export default doorResolver;
