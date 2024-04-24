import { useDataLoader } from '@/dataloaders';
import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated } from '@/util';
import { HeheAPI } from '@api/hehe';
import { Feature, Resolvers } from '@generated/graphql';
import { heheReduce } from '@reducer/hehe';

const api = new HeheAPI();

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
      const h = await api.getHehe(number, year);
      return reduce(h, heheReduce);
    },
    hehes: async (_, { year }, ctx) => {
      await hasAuthenticated(ctx);
      const h = await api.getHehesByYear(year);
      return reduce(h, heheReduce);
    },
    latestHehe: async (_, { limit, sortOrder }, ctx) => {
      await hasAuthenticated(ctx);
      const h = await api.getAllHehes(limit ?? undefined, sortOrder ?? undefined);
      return reduce(h, heheReduce);
    },
  },
  Mutation: {
    addHehe: async (_, { fileId, number, year }, ctx) => {
      await hasAccess(ctx, Feature.HeheAdmin);
      const coverId = await api.createHeheCover(ctx.getUsername(), fileId, number, year);
      return api.addHehe(ctx.getUsername(), fileId, coverId, number, year);
    },
    removeHehe: async (_, { number, year }, ctx) => {
      await hasAccess(ctx, Feature.HeheAdmin);
      return api.removeHehe(number, year);
    },
  },
};

export default heheResolver;
