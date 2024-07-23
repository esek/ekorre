import { hasAuthenticated } from '@/util';
import { Resolvers } from '@generated/graphql';
import { latexify } from '@service/latexify';

const latexifyResolver: Resolvers = {
  Query: {
    latexify: async (_, { text }, ctx) => {
      await hasAuthenticated(ctx);
      const res = await latexify(text);
      return res;
    },
  },
};

export default latexifyResolver;
