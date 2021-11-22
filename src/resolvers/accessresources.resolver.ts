import AccessResourcesAPI from '../api/accessresources.api';
import { ServerError } from '../errors/RequestErrors';
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
  AccessMapping: {
    resources: async ({ resources }, _, ctx) => {
      // If resources is empty, just return null
      if (!resources?.length) {
        return null;
      }
      try {
        // try to load the mappings from datalodaer
        const r = await ctx.accessResourceDataloader.loadMany(resources.map((r) => r.slug ?? ''));
        return r;
      } catch (err) {
        throw new ServerError((err as Error).message);
      }
    },
  },
};

export default doorResolver;
