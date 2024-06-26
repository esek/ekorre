import { useDataLoader } from '@/dataloaders';
import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated } from '@/util';
import { HeheAPI } from '@api/hehe';
import { Feature, Resolvers } from '@generated/graphql';
import { heheReduce } from '@reducer/hehe';

const heheApi = new HeheAPI();

const heheResolver: Resolvers = {
  Hehe: {
    uploader: useDataLoader((model, context) => ({
      dataLoader: context.userDataLoader,
      key: model.uploader.username,
    })),
    file: useDataLoader((model, context) => ({
      dataLoader: context.fileDataLoader,
      key: model.file.id,
    })),
  },
  Query: {
    hehe: async (_, { number, year }, ctx) => {
      await hasAuthenticated(ctx);
      const hehes = await heheApi.getHehe(number, year);
      return reduce(hehes, heheReduce);
    },
    hehes: async (_, { year }, ctx) => {
      await hasAuthenticated(ctx);
      const hehes = await heheApi.getHehesByYear(year);
      return reduce(hehes, heheReduce);
    },
    latestHehe: async (_, { limit, sortOrder }, ctx) => {
      await hasAuthenticated(ctx);
      const hehes = await heheApi.getAllHehes(limit ?? undefined, sortOrder ?? undefined);
      return reduce(hehes, heheReduce);
    },
    paginatedHehes: async (_, { pagination }, ctx) => {
      await hasAuthenticated(ctx);
      const [pageInfo, hehes] = await heheApi.getHehesByPagination(pagination ?? undefined);
      return {
        pageInfo,
        values: reduce(hehes, heheReduce),
      };
    },
  },
  Mutation: {
    addHehe: async (_, { fileId, number, year }, ctx) => {
      await hasAccess(ctx, Feature.HeheAdmin);
      const coverId = await heheApi.createHeheCover(ctx.getUsername(), fileId);
      return heheApi.addHehe(ctx.getUsername(), fileId, coverId, number, year);
    },
    removeHehe: async (_, { number, year }, ctx) => {
      await hasAccess(ctx, Feature.HeheAdmin);
      return heheApi.removeHehe(number, year);
    },
  },
};

export default heheResolver;
