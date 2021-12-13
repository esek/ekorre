import { HeheAPI } from '../api/hehe.api';
import { reduce } from '../reducers';
import { heheReduce } from '../reducers/hehe.reducer';
import { useDataLoader } from '../dataloaders';
import { Resolvers } from '../graphql.generated';

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
    }))
  },
  Query: {
    hehe: async (_, { number, year }) => {
      const h = await api.getHehe(number, year);
      return reduce(h, heheReduce);
    },
    hehes: async (_, { year }) => {
      const h = await api.getHehesByYear(year);
      return reduce(h, heheReduce);
    },
    latestHehe: async (_, { limit }) => {
      const h = await api.getAllHehes(limit ?? undefined);
      return reduce(h, heheReduce);
    },
  },
  Mutation: {
    addHehe: async (_, { fileId, number, year }, ctx) => api.addHehe(ctx.getUsername(), fileId, number, year),
    removeHehe: async (_, { number, year }) => api.removeHehe(number, year),
  },
};

export default heheResolver;